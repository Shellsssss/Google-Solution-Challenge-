"""On-server TFLite inference — used by WhatsApp pipeline and /api/v1/analyze."""
import io
import json
import logging
import os

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Try modern ai-edge-litert first, fall back to tflite_runtime, then full tensorflow
try:
    from ai_edge_litert.interpreter import Interpreter as _Interpreter
    logger.info("Using ai-edge-litert for TFLite inference")
except ImportError:
    try:
        from tflite_runtime.interpreter import Interpreter as _Interpreter
        logger.info("Using tflite_runtime for TFLite inference")
    except ImportError:
        import tensorflow as tf
        _Interpreter = tf.lite.Interpreter
        logger.info("Using tensorflow.lite for TFLite inference")

# Model config
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS_DIR = os.path.normpath(os.path.join(_BASE, "..", "app", "assets", "models"))

_MODEL_PATHS = {
    "oral": os.path.join(_MODELS_DIR, "janarogya_oral_f32.tflite"),
    "skin": os.path.join(_MODELS_DIR, "janarogya_skin_int8.tflite"),
}
_LABEL_PATHS = {
    "oral": os.path.join(_MODELS_DIR, "labels_oral.json"),
    "skin": os.path.join(_MODELS_DIR, "labels_skin.json"),
}

_INPUT_SIZE = 224  # EfficientNetB3 trained at 224x224

_interpreters: dict = {}
_labels: dict = {}


def _load_labels(scan_type: str) -> list[str]:
    if scan_type not in _labels:
        path = _LABEL_PATHS.get(scan_type)
        if path and os.path.exists(path):
            with open(path) as f:
                raw = json.load(f)
            _labels[scan_type] = [raw[str(i)] for i in range(len(raw))]
        else:
            _labels[scan_type] = ["LOW_RISK", "HIGH_RISK", "INVALID"]
    return _labels[scan_type]


def _get_interpreter(scan_type: str):
    if scan_type not in _interpreters:
        path = _MODEL_PATHS.get(scan_type)
        if not path or not os.path.exists(path):
            raise FileNotFoundError(f"TFLite model not found: {path}")
        interp = _Interpreter(model_path=path)
        interp.allocate_tensors()
        _interpreters[scan_type] = interp
        logger.info("Loaded TFLite model: %s (%s)", scan_type, path)
    return _interpreters[scan_type]


def run_inference(image_bytes: bytes, scan_type: str) -> tuple[str, float]:
    """Run TFLite model on image bytes. Returns (risk_label, confidence).
    Fails safe → HIGH_RISK 0.60 so the pipeline never silently skips a real case."""
    try:
        interp = _get_interpreter(scan_type)
        labels = _load_labels(scan_type)

        input_details  = interp.get_input_details()
        output_details = interp.get_output_details()

        # Preprocess: resize to 224x224, normalize to [0, 1]
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(
            (_INPUT_SIZE, _INPUT_SIZE), Image.BILINEAR
        )
        arr = np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

        # Handle int8 quantized models
        input_dtype = input_details[0]["dtype"]
        if input_dtype == np.int8 or input_dtype == np.uint8:
            scale, zero_point = input_details[0]["quantization"]
            if scale != 0:
                arr = (arr / scale + zero_point).astype(input_dtype)
            else:
                arr = arr.astype(input_dtype)

        interp.set_tensor(input_details[0]["index"], arr)
        interp.invoke()

        output = interp.get_tensor(output_details[0]["index"])[0]

        # Dequantize if needed
        out_dtype = output_details[0]["dtype"]
        if out_dtype == np.int8 or out_dtype == np.uint8:
            scale, zero_point = output_details[0]["quantization"]
            output = (output.astype(np.float32) - zero_point) * scale

        # Softmax if raw logits (not already probabilities)
        if output.max() > 1.0 or output.min() < 0.0:
            output = np.exp(output - output.max())
            output = output / output.sum()

        idx   = int(np.argmax(output))
        conf  = float(output[idx])
        label = labels[idx] if idx < len(labels) else "INVALID"

        logger.info("TFLite %s → %s (%.2f)", scan_type, label, conf)
        return label, conf

    except Exception as exc:
        logger.error("TFLite inference failed (%s): %s — using safe fallback", scan_type, exc)
        return "HIGH_RISK", 0.60
