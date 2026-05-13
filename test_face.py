import cv2
import numpy as np
import mediapipe as mp

try:
    mp_face_mesh = mp.solutions.face_mesh
except AttributeError:
    import mediapipe.python.solutions.face_mesh as mp_face_mesh

img_path = "/Users/lee/SKU-SW/base-boy.png"
img = cv2.imread(img_path)
h, w = img.shape[:2]

with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1) as face_mesh:
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_img)
    if not results.multi_face_landmarks:
        print("No face detected.")
    else:
        print("Face detected!")
