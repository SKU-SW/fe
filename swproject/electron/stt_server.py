#!/usr/bin/env python3
"""
SKU-SW STT daemon (Faster Whisper).

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
    {"event": "ready", "model": "small"}
    {"event": "fatal", "error": "..."}        # 시작 단계 치명적 실패

환경변수:
  SKU_SW_STT_MODEL     — 기본 "small". tiny|base|small|medium|large-v3 등
  SKU_SW_STT_MODEL_DIR — 동봉된 로컬 모델 디렉토리 경로. 설정되어 있고 존재하면
                          인터넷 다운로드 없이 (local_files_only) 이 경로에서 로드.
                          (배포본은 main.ts 가 resourcesPath/models/<name> 을 주입)
  SKU_SW_STT_PROMPT    — initial_prompt 문자열 (한국어 도메인 컨텍스트)
"""

import json
import os
import sys

# Windows 한국어 로캘에서는 stdout 기본 인코딩이 cp949 라, 한글이 든 JSON 을 그대로 쓰면
# Electron main(utf-8 로 read)에서 mojibake 가 된다. 그러면 finalText 가 깨져 호출어 매칭이
#실패하고 백엔드로 전송되지 않는다. stdio 를 UTF-8 로 강제 재설정한다.
for _stream in (sys.stdin, sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    except Exception:
        pass


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main():
    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        # 모든 import 실패를 "미설치"로 뭉개지 말고 실제 에러를 전달
        emit({
            "event": "fatal",
            "error": f"faster-whisper 로드 실패: {type(exc).__name__}: {exc}",
        })
        return 1

    model_name = os.environ.get("SKU_SW_STT_MODEL", "small")
    initial_prompt = os.environ.get(
        "SKU_SW_STT_PROMPT",
        "방송 중 게임 채팅. 스트리머, AI 캐릭터, 시청자 대화. "
        "리그 오브 레전드 챔피언 이즈리얼, 아리, 야스오, 제드, 미드, 탑, 정글, 원딜, 서폿. "
        "발로란트, 오버워치, 배틀그라운드.",
    )

    # 동봉 모델 디렉토리가 지정되어 있으면 오프라인(local_files_only)으로 로드.
    # 없으면 모델 이름으로 Hugging Face 에서 다운로드(첫 실행 시 인터넷 필요).
    model_dir = os.environ.get("SKU_SW_STT_MODEL_DIR", "").strip()
    use_local = bool(model_dir) and os.path.isdir(model_dir)
    model_ref = model_dir if use_local else model_name

    try:
        model = WhisperModel(
            model_ref,
            device="auto",
            compute_type="int8",
            local_files_only=use_local,
        )
    except Exception as exc:
        emit({"event": "fatal", "error": f"모델 로드 실패: {exc}"})
        return 1

    emit({"event": "ready", "model": model_dir if use_local else model_name})

    # 메인 루프: 한 줄 = 한 요청 (line-delimited JSON)
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

            segments, _info = model.transcribe(
                audio_path,
                language="ko",
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
                condition_on_previous_text=True,
                initial_prompt=initial_prompt,
            )
            text = " ".join(s.text.strip() for s in segments if s.text.strip()).strip()
            emit({"id": req_id, "ok": True, "text": text})

        except json.JSONDecodeError as exc:
            emit({"id": None, "ok": False, "error": f"JSON 파싱 실패: {exc}"})
        except Exception as exc:
            emit({"id": req_id, "ok": False, "error": str(exc)})

    return 0


if __name__ == "__main__":
    # PyInstaller 로 frozen 된 바이너리에서 ctranslate2/VAD 등이 multiprocessing 서브프로세스를
    # 띄울 때, freeze_support() 가 없으면 자식이 worker 가 아니라 이 스크립트(main)를 통째로
    # 재실행한다 → 모델(수백 MB)을 중복 로드하고 stdin 루프에도 들어가 "요청은 갔는데 응답이
    # 영영 안 오는" 경합을 일으킨다. 반드시 main 진입 전에 호출해야 한다.
    import multiprocessing

    multiprocessing.freeze_support()
    raise SystemExit(main() or 0)
