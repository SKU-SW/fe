#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

HF_MODEL_IDS = {
    "tiny": "openai/whisper-tiny",
    "base": "openai/whisper-base",
    "small": "openai/whisper-small",
    "medium": "openai/whisper-medium",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Prepare OpenVINO Whisper model")
    parser.add_argument("--model", default="small", choices=sorted(HF_MODEL_IDS.keys()))
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    from optimum.intel import OVModelForSpeechSeq2Seq
    from transformers import AutoProcessor

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = OVModelForSpeechSeq2Seq.from_pretrained(
        HF_MODEL_IDS[args.model],
        export=True,
        compile=False,
    )
    model.save_pretrained(str(output_dir))

    processor = AutoProcessor.from_pretrained(HF_MODEL_IDS[args.model])
    processor.save_pretrained(str(output_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
