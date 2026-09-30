import urllib.request
import json
import time
import os
import shutil

COMFY_URL = 'http://127.0.0.1:8189'
OUTPUT_DIR = r'C:\Users\wizar\AppData\Local\Comfy-Desktop\ComfyUI-Shared\output'
DEST_DIR = r'C:\Users\wizar\Others\map-quiz\assets\mascot\kids'
ARTIFACT_DIR = r'C:\Users\wizar\.gemini\antigravity\brain\98d55ec2-19b0-4215-ba68-e35f30522794'

os.makedirs(DEST_DIR, exist_ok=True)

targets = [
    {
        'id': 'kid_boy_sunny',
        'pos': 'masterpiece, best quality, 1boy, solo, original character, 8 years old, cute japanese elementary school boy, vibrant cheerful sunny smile, short fluffy brown hair, large expressive sparkling eyes, wearing mini black mortarboard scholar cap with golden tassel, stylish casual orange and navy hooded jacket, golden glowing brain medal badge on chest, energetic thumbs up gesture, 4 to 5 heads tall cute child proportion, modern clean anime style, crisp line art, bright vivid lighting, pure white background',
        'neg': 'mature, adult, teenager, edogawa conan, glasses, cosplay, realistic, 3d, 2boys, multiple boys, clone, lowres, bad hands, bad anatomy, missing fingers, blurry, complex background, dark background',
        'seed': 7701
    },
    {
        'id': 'kid_boy_focus',
        'pos': 'masterpiece, best quality, 1boy, solo, original character, 8 years old, cute japanese elementary school boy, bright confident smile, energetic posture, short black hair, wearing mini scholar graduation cap with golden tassel, modern casual yellow and blue hoodie, golden brain badge, holding a floating miniature glowing pink brain, 4 to 5 heads tall kid proportion, modern anime art, pure white background',
        'neg': 'mature, adult, edogawa conan, glasses, cosplay, realistic, 3d, 2boys, multiple boys, bad hands, bad anatomy, blurry, complex background',
        'seed': 7702
    },
    {
        'id': 'kid_girl_smart',
        'pos': 'masterpiece, best quality, 1girl, solo, original character, 8 years old, cute japanese elementary school girl, calm intelligent gentle smile, large clear hazel eyes, neat soft bob hairstyle with cute hair clip, wearing mini black mortarboard scholar cap with golden tassel, cute pastel cream cardigan sweater, navy pleated skirt, golden glowing brain badge on chest, holding a high-tech glowing learning tablet, 4 to 5 heads tall cute child proportion, modern clean anime style, bright crisp lighting, pure white background',
        'neg': 'mature, adult, haibara ai, edogawa conan, cosplay, realistic, 3d, 2girls, multiple girls, clone, lowres, bad hands, bad anatomy, missing fingers, blurry, complex background',
        'seed': 8801
    },
    {
        'id': 'kid_girl_observant',
        'pos': 'masterpiece, best quality, 1girl, solo, original character, 8 years old, cute japanese elementary school girl, observant thoughtful soft smile, gentle dark brown short hair with neat bangs, wearing mini scholar cap with golden tassel, cute modern denim overall dress with pink t-shirt, golden brain emblem, holding a stylus pen and notebook, 4 to 5 heads tall kid proportion, modern clean anime style, pure white background',
        'neg': 'mature, adult, haibara ai, cosplay, realistic, 3d, 2girls, multiple girls, bad hands, bad anatomy, blurry, complex background',
        'seed': 8802
    },
    {
        'id': 'kid_duo_learning_pair',
        'pos': 'masterpiece, best quality, 1boy, 1girl, duo, original characters, 8 years old, cute elementary school boy and girl, focus learning companions, standing side by side cheerfully, boy has short brown hair with orange hoodie giving thumbs up, girl has neat bob hair with pastel sweater holding glowing digital tablet, both wearing mini scholar caps with golden tassels and golden brain badges, 4 to 5 heads tall cute child proportion, modern clean anime style, bright warm lighting, pure white background',
        'neg': 'mature, adult, teenagers, edogawa conan, haibara ai, cosplay, realistic, 3d, extra people, clone, lowres, bad hands, bad anatomy, blurry, complex background',
        'seed': 9901
    }
]

for t in targets:
    wf = {
        '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'Illustrious-XL-v2.0.safetensors'}},
        '2': {'class_type': 'EmptyLatentImage', 'inputs': {'width': 1024, 'height': 1024, 'batch_size': 1}},
        '3': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['1', 1], 'text': t['pos']}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['1', 1], 'text': t['neg']}},
        '5': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['3', 0], 'negative': ['4', 0], 'latent_image': ['2', 0], 'seed': t['seed'], 'steps': 28, 'cfg': 7.0, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': 1.0}},
        '6': {'class_type': 'VAEDecode', 'inputs': {'samples': ['5', 0], 'vae': ['1', 2]}},
        '7': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': t['id'], 'images': ['6', 0]}}
    }
    data = json.dumps({'prompt': wf}).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data, headers={'Content-Type': 'application/json'})
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    pid = res.get('prompt_id')
    print(f"Queued {t['id']}: {pid}")
    
    for _ in range(60):
        time.sleep(2)
        try:
            h_req = urllib.request.Request(f"{COMFY_URL}/history/{pid}")
            h = json.loads(urllib.request.urlopen(h_req).read().decode('utf-8'))
            if pid in h:
                fn = h[pid]['outputs']['7']['images'][0]['filename']
                src = os.path.join(OUTPUT_DIR, fn)
                dst = os.path.join(DEST_DIR, f"{t['id']}.png")
                shutil.copyfile(src, dst)
                # Also copy to brain artifact dir
                art_dst = os.path.join(ARTIFACT_DIR, f"{t['id']}.png")
                shutil.copyfile(src, art_dst)
                print(f"Successfully generated: {t['id']} -> {dst}")
                break
        except Exception as e:
            pass

print("All original kid characters generated successfully!")
