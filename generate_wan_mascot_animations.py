import urllib.request
import json
import time
import os
import shutil

COMFY_URL = 'http://127.0.0.1:8189'
INPUT_DIR = r'C:\Users\wizar\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\input'
OUTPUT_DIR = r'C:\Users\wizar\AppData\Local\Comfy-Desktop\ComfyUI-Shared\output'
DEST_DIR = r'C:\Users\wizar\Others\map-quiz\assets\mascot\kids\animations'
ARTIFACT_DIR = r'C:\Users\wizar\.gemini\antigravity\brain\98d55ec2-19b0-4215-ba68-e35f30522794'

os.makedirs(DEST_DIR, exist_ok=True)

# Copy source still image into ComfyUI input directory
src_img = r'C:\Users\wizar\Others\map-quiz\assets\mascot\kids\kid_boy_sunny.png'
shutil.copyfile(src_img, os.path.join(INPUT_DIR, 'kid_boy_sunny.png'))

def generate_wan_anim(anim_id, prompt_text, seed=2026, steps=16, length=17):
    wf = {
        '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'wan2.1-i2v-14b-480p-Q4_K_M.gguf'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', 'type': 'wan'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'wan_2.1_vae.safetensors'}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': prompt_text}},
        '5': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': 'lowres, bad quality, blurry, distorted face, bad anatomy, jumpy, chaotic jitter, flickering'}},
        '6': {'class_type': 'LoadImage', 'inputs': {'image': 'kid_boy_sunny.png'}},
        '7': {'class_type': 'WanImageToVideo', 'inputs': {'positive': ['4', 0], 'negative': ['5', 0], 'vae': ['3', 0], 'width': 480, 'height': 480, 'length': length, 'batch_size': 1, 'start_image': ['6', 0]}},
        '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['7', 0], 'negative': ['7', 1], 'latent_image': ['7', 2], 'seed': seed, 'steps': steps, 'cfg': 5.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
        '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveAnimatedWEBP', 'inputs': {'images': ['9', 0], 'filename_prefix': anim_id, 'fps': 10.0, 'lossless': False, 'quality': 85, 'method': 'default'}}
    }

    data = json.dumps({'prompt': wf}).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data, headers={'Content-Type': 'application/json'})
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    pid = res.get('prompt_id')
    print(f"Queued Wan 2.1 anim '{anim_id}' with PID: {pid}")

    for sec in range(120):
        time.sleep(2)
        try:
            h_req = urllib.request.Request(f"{COMFY_URL}/history/{pid}")
            h = json.loads(urllib.request.urlopen(h_req).read().decode('utf-8'))
            if pid in h:
                outputs = h[pid]['outputs']
                fn = outputs['10']['images'][0]['filename']
                src_path = os.path.join(OUTPUT_DIR, fn)
                dst_path = os.path.join(DEST_DIR, f"{anim_id}.webp")
                shutil.copyfile(src_path, dst_path)
                art_path = os.path.join(ARTIFACT_DIR, f"{anim_id}.webp")
                shutil.copyfile(src_path, art_path)
                print(f"Finished generating: {dst_path} ({os.path.getsize(dst_path)} bytes)")
                return dst_path
        except Exception as e:
            pass
        if sec % 5 == 0:
            print(f"Waiting... {sec*2}s")

    print(f"Timed out generating {anim_id}")
    return None

if __name__ == '__main__':
    # Test Animation 1: Ready - The boy waving cheerfully and blinking, asking if ready
    p = "masterpiece, best quality, the 8-year-old anime boy waves his hand cheerfully at the viewer, blinking his big bright eyes, smiling warmly with excitement, nodding head slightly, asking are you ready, smooth vivid character animation, pure white background"
    generate_wan_anim("boy_ready_wave", p, seed=3301, steps=16, length=17)
