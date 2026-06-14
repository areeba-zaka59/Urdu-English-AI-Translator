from rest_framework.decorators import api_view
from rest_framework.response import Response
from transformers import MarianMTModel, MarianTokenizer
import whisper
import tempfile
import os

model_name = "Helsinki-NLP/opus-mt-ur-en"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)
whisper_model = whisper.load_model("base")

def translate_urdu_to_english(urdu_text):
    inputs = tokenizer([urdu_text], return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    return tokenizer.decode(translated[0], skip_special_tokens=True)

@api_view(['POST'])
def translate_text(request):
    urdu_text = request.data.get('text', '')
    if not urdu_text:
        return Response({'error': 'No text provided'}, status=400)
    english_text = translate_urdu_to_english(urdu_text)
    return Response({'urdu': urdu_text, 'english': english_text})

@api_view(['POST'])
def translate_audio(request):
    audio_file = request.FILES.get('audio')
    if not audio_file:
        return Response({'error': 'No audio provided'}, status=400)
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        for chunk in audio_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name
    
    result = whisper_model.transcribe(tmp_path, language='ur')
    urdu_text = result['text']
    english_text = translate_urdu_to_english(urdu_text)
    os.unlink(tmp_path)
    
    return Response({'urdu': urdu_text, 'english': english_text})