#!/usr/bin/env python3
"""
SKU-SW STT daemon (OpenVINO 우선 / Faster Whisper fallback).

데몬 모드:
  - 시작 시 모델 1번 로드 후 무한 루프
  - stdin 한 줄 = JSON 요청 1건
  - stdout 한 줄 = JSON 응답 1건 (id 로 매칭)
  - stdin EOF 시 정상 종료

Protocol:
  Request:  {"id": "<uuid>", "audio_path": "/tmp/foo.webm"}
  Response: {"id": "<uuid>", "ok": true, "text": "..."}
            {"id": "<uuid>", "ok": false, "error": "..."}
  Lifecycle (id 없음):
    {"event": "ready", "model": "small", "engine": "openvino", "device": "GPU.1"}
    {"event": "fatal", "error": "...", "engine": "openvino"}

환경변수:
  SKU_SW_STT_MODEL              — 기본 "small". tiny|base|small|medium
  SKU_SW_STT_MODEL_DIR          — faster-whisper 로컬 모델 디렉토리 경로
  SKU_SW_STT_OPENVINO_MODEL_DIR — OpenVINO IR 모델 디렉토리 경로
  SKU_SW_STT_ENGINE             — auto|openvino|faster-whisper
  SKU_SW_STT_DEVICE             — auto|GPU|GPU.1|CPU|cuda|cpu
  SKU_SW_STT_PROMPT             — initial_prompt 문자열
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
from pathlib import Path

import numpy as np


for _stream in (sys.stdin, sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    except Exception:
        pass


HF_MODEL_IDS = {
    "tiny": "openai/whisper-tiny",
    "base": "openai/whisper-base",
    "small": "openai/whisper-small",
    "medium": "openai/whisper-medium",
}


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def package_available(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def env_flag(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def openvino_devices() -> list[str]:
    if not package_available("openvino"):
        return []
    try:
        import openvino as ov

        return list(ov.Core().get_available_devices())
    except Exception:
        return []


def resolve_openvino_device(requested: str) -> str:
    if requested and requested.lower() != "auto":
        return requested

    devices = openvino_devices()
    for candidate in ("GPU.1", "GPU.0", "GPU"):
        if candidate in devices:
            return candidate
    return "CPU"


def resolve_faster_whisper_device(requested: str) -> str:
    lowered = requested.lower()
    if lowered in {"cuda", "cpu"}:
        return lowered
    if sys.platform == "darwin":
        return "cpu"

    # Windows/Linux 에서 NVIDIA 드라이버가 있으면 CUDA 경로를 우선 사용.
    try:
        import shutil
        import subprocess

        nvidia_smi = shutil.which("nvidia-smi")
        if nvidia_smi:
            proc = subprocess.run(
                [nvidia_smi, "-L"],
                capture_output=True,
                text=True,
                check=True,
                timeout=3,
            )
            if "GPU" in proc.stdout:
                return "cuda"
    except Exception:
        pass

    return "auto"


def ensure_openvino_model(model_name: str, explicit_dir: str) -> str:
    if explicit_dir and os.path.isdir(explicit_dir):
        return explicit_dir

    if not env_flag("SKU_SW_STT_AUTO_EXPORT", True):
        raise FileNotFoundError("OpenVINO 모델이 없고 자동 export 가 비활성화되어 있습니다.")

    if not package_available("optimum.intel") or not package_available("transformers"):
        raise FileNotFoundError("OpenVINO 모델 자동 준비를 위한 optimum-intel/transformers 가 없습니다.")

    cache_root = Path.home() / ".sku-sw-stt" / "models"
    output_dir = cache_root / f"whisper-{model_name}-ov"
    if output_dir.exists():
        return str(output_dir)

    from optimum.intel import OVModelForSpeechSeq2Seq
    from transformers import AutoProcessor

    output_dir.mkdir(parents=True, exist_ok=True)
    model = OVModelForSpeechSeq2Seq.from_pretrained(HF_MODEL_IDS[model_name], export=True, compile=False)
    model.save_pretrained(str(output_dir))
    processor = AutoProcessor.from_pretrained(HF_MODEL_IDS[model_name])
    processor.save_pretrained(str(output_dir))
    return str(output_dir)


class FasterWhisperRuntime:
    def __init__(self, model_name: str, model_dir: str, requested_device: str, initial_prompt: str):
        from faster_whisper import WhisperModel

        use_local = bool(model_dir) and os.path.isdir(model_dir)
        model_ref = model_dir if use_local else model_name
        self.device = resolve_faster_whisper_device(requested_device)
        self.model = WhisperModel(
            model_ref,
            device=self.device,
            compute_type="int8",
            local_files_only=use_local,
        )
        self.engine = "faster-whisper"
        self.model_name = model_dir if use_local else model_name
        self.initial_prompt = initial_prompt

    def transcribe(self, audio_path: str) -> str:
        segments, _info = self.model.transcribe(
            audio_path,
            language="ko",
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
            condition_on_previous_text=True,
            initial_prompt=self.initial_prompt,
        )
        return " ".join(s.text.strip() for s in segments if s.text.strip()).strip()


class OpenVINORuntime:
    def __init__(self, model_name: str, model_dir: str, requested_device: str):
        import openvino_genai as ov_genai
        from faster_whisper.audio import decode_audio

        self.decode_audio = decode_audio
        self.model_dir = ensure_openvino_model(model_name, model_dir)
        self.device = resolve_openvino_device(requested_device)
        self.pipe = ov_genai.WhisperPipeline(self.model_dir, device=self.device)
        self.engine = "openvino"
        self.model_name = self.model_dir

    def transcribe(self, audio_path: str) -> str:
        audio = np.asarray(self.decode_audio(audio_path, sampling_rate=16000), dtype=np.float32).flatten()
        result = self.pipe.generate(
            audio.tolist(),
            max_new_tokens=448,
            task="transcribe",
            language="<|ko|>",
            return_timestamps=False,
        )
        texts = getattr(result, "texts", None)
        if texts:
            return str(texts[0]).strip()
        return str(getattr(result, "text", "")).strip()


def select_runtime(model_name: str, model_dir: str, openvino_model_dir: str, requested_engine: str, requested_device: str, initial_prompt: str):
    engine = requested_engine.lower().replace("_", "-")
    candidates = [engine] if engine in {"openvino", "faster-whisper"} else ["openvino", "faster-whisper"]

    errors: list[str] = []
    for candidate in candidates:
        try:
            if candidate == "openvino":
                if sys.platform == "darwin":
                    raise RuntimeError("macOS 에서는 OpenVINO GPU 경로를 사용하지 않습니다.")
                if not package_available("openvino_genai"):
                    raise RuntimeError("openvino_genai 패키지가 없습니다.")
                return OpenVINORuntime(model_name, openvino_model_dir, requested_device)

            if not package_available("faster_whisper"):
                raise RuntimeError("faster_whisper 패키지가 없습니다.")
            return FasterWhisperRuntime(model_name, model_dir, requested_device, initial_prompt)
        except Exception as exc:
            errors.append(f"{candidate}: {type(exc).__name__}: {exc}")

    raise RuntimeError(" | ".join(errors))


def main():
    model_name = os.environ.get("SKU_SW_STT_MODEL", "small")
    requested_engine = os.environ.get("SKU_SW_STT_ENGINE", "auto")
    requested_device = os.environ.get("SKU_SW_STT_DEVICE", "auto")
    initial_prompt = os.environ.get(
        "SKU_SW_STT_PROMPT",
        "방송 중 게임 채팅. 스트리머, AI 캐릭터, 시청자 대화. "
        "리그 오브 레전드 챔피언 이즈리얼, 아리, 야스오, 제드, 미드, 탑, 정글, 원딜, 서폿. "
        "발로란트, 오버워치, 배틀그라운드.",
    )

    model_dir = os.environ.get("SKU_SW_STT_MODEL_DIR", "").strip()
    openvino_model_dir = os.environ.get("SKU_SW_STT_OPENVINO_MODEL_DIR", "").strip()

    try:
        runtime = select_runtime(
            model_name=model_name,
            model_dir=model_dir,
            openvino_model_dir=openvino_model_dir,
            requested_engine=requested_engine,
            requested_device=requested_device,
            initial_prompt=initial_prompt,
        )
    except Exception as exc:
        emit({
            "event": "fatal",
            "engine": requested_engine,
            "device": requested_device,
            "error": f"모델 로드 실패: {exc}",
        })
        return 1

    emit({
        "event": "ready",
        "model": runtime.model_name,
        "engine": runtime.engine,
        "device": runtime.device,
    })

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            audio_path = req.get("audio_path")

            if not audio_path:
                emit({"id": req_id, "ok": False, "error": "audio_path 누락"})
                continue
            if not os.path.exists(audio_path):
                emit({"id": req_id, "ok": False, "error": f"audio not found: {audio_path}"})
                continue

            text = runtime.transcribe(audio_path)
            emit({"id": req_id, "ok": True, "text": text})

        except json.JSONDecodeError as exc:
            emit({"id": None, "ok": False, "error": f"JSON 파싱 실패: {exc}"})
        except Exception as exc:
            emit({"id": req_id, "ok": False, "error": str(exc)})

    return 0


if __name__ == "__main__":
    import multiprocessing

    multiprocessing.freeze_support()
    raise SystemExit(main() or 0)
