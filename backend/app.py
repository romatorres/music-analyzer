# app.py - Backend Flask para análise musical com Demucs
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import librosa
import soundfile as sf
from pathlib import Path
import shutil
import threading
import time
import json
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Progress tracking
progress_data = {}
analysis_history = []
analysis_cache = {}  # Cache para armazenar dados completos das análises

# Diretórios
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
STEMS_FOLDER = 'stems'
HISTORY_FILE = 'analysis_history.json'
CACHE_FILE = 'analysis_cache.json'

for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, STEMS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Carregar histórico e cache do arquivo ao iniciar
def load_history_from_file():
    """Carrega histórico do arquivo JSON"""
    global analysis_history
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                analysis_history = json.load(f)
                print(f"✓ Histórico carregado: {len(analysis_history)} análises")
    except Exception as e:
        print(f"Erro ao carregar histórico: {e}")
        analysis_history = []

def save_history_to_file():
    """Salva histórico no arquivo JSON"""
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(analysis_history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar histórico: {e}")

def load_cache_from_file():
    """Carrega cache do arquivo JSON"""
    global analysis_cache
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                analysis_cache = json.load(f)
                print(f"✓ Cache carregado: {len(analysis_cache)} análises")
    except Exception as e:
        print(f"Erro ao carregar cache: {e}")
        analysis_cache = {}

def save_cache_to_file():
    """Salva cache no arquivo JSON"""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(analysis_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar cache: {e}")

# Carregar dados ao iniciar
load_history_from_file()
load_cache_from_file()

@app.route('/api/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    """Retorna o progresso de uma tarefa específica"""
    if task_id in progress_data:
        return jsonify(progress_data[task_id])
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/history', methods=['GET'])
def get_history():
    """Retorna histórico de análises"""
    return jsonify({'history': analysis_history})

@app.route('/api/analysis/<filename>', methods=['GET'])
def get_analysis(filename):
    """Retorna dados completos de uma análise anterior"""
    try:
        # Buscar no cache
        if filename in analysis_cache:
            return jsonify(analysis_cache[filename])
        
        # Se não estiver no cache, tentar reconstruir dos stems
        song_name = Path(filename).stem
        demucs_output = os.path.join(STEMS_FOLDER, 'htdemucs', song_name)
        
        if not os.path.exists(demucs_output):
            return jsonify({'error': 'Análise não encontrada'}), 404
        
        # Listar stems disponíveis
        stems_info = []
        for stem_file in os.listdir(demucs_output):
            if stem_file.endswith('.wav'):
                stem_name = Path(stem_file).stem
                stems_info.append({
                    'name': stem_name,
                    'url': f'/api/download/{song_name}/{stem_name}'
                })
        
        return jsonify({
            'status': 'success',
            'stems': stems_info,
            'chords': [],  # Acordes não são salvos, precisaria reprocessar
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/waveform', methods=['POST'])
def generate_waveform():
    """Gera dados de waveform para visualização"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Carregar áudio com resolução reduzida para performance
        # Suprimir warnings do librosa/audioread sobre metadados
        import warnings
        warnings.filterwarnings('ignore', category=UserWarning)
        
        y, sr = librosa.load(filepath, sr=22050)
        
        # Downsample para visualização (1000 pontos por minuto)
        target_length = int(len(y) / sr * 1000 / 60) * 60
        if len(y) > target_length:
            y_downsampled = librosa.resample(y, orig_sr=sr, target_sr=int(sr * target_length / len(y)))
        else:
            y_downsampled = y
        
        # Normalizar para visualização
        waveform_data = y_downsampled.tolist()
        
        return jsonify({
            'waveform': waveform_data,
            'duration': float(len(y) / sr),
            'sample_rate': sr
        })
        
    except Exception as e:
        print(f"Erro ao gerar waveform: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica se o servidor está rodando"""
    return jsonify({
        'status': 'ok',
        'message': 'Music Analyzer API está rodando!',
        'engine': 'Demucs 4.0'
    })

def update_progress(task_id, step, message, percentage):
    """Atualiza o progresso de uma tarefa"""
    progress_data[task_id] = {
        'step': step,
        'message': message,
        'percentage': percentage,
        'timestamp': datetime.now().isoformat()
    }

def add_to_history(filename, stems_count, chords_count, duration, stems=None, chords=None):
    """Adiciona análise ao histórico e cache"""
    analysis_history.insert(0, {
        'filename': filename,
        'stems_count': stems_count,
        'chords_count': chords_count,
        'duration': duration,
        'timestamp': datetime.now().isoformat()
    })
    # Manter apenas os últimos 20 itens
    if len(analysis_history) > 20:
        analysis_history.pop()
    
    # Salvar histórico em arquivo
    save_history_to_file()
    
    # Salvar dados completos no cache
    if stems is not None and chords is not None:
        analysis_cache[filename] = {
            'status': 'success',
            'stems': stems,
            'chords': chords,
            'filename': filename,
            'duration': duration
        }
        # Salvar cache em arquivo
        save_cache_to_file()
def separate_audio():
    """Separa o áudio em stems usando Demucs"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'Nome de arquivo vazio'}), 400
        
        # Salvar arquivo
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        print(f"Arquivo recebido: {filename}")
        print("Iniciando separação com Demucs... (isso pode levar alguns minutos)")
        
        # Executar Demucs via Python
        song_name = Path(filename).stem
        
        # Importar e executar Demucs diretamente
        import sys
        cmd = [
            sys.executable, '-m', 'demucs',
            '--two-stems=vocals',
            '-n', 'htdemucs',
            '--out', STEMS_FOLDER,
            filepath
        ]
        
        # Executar Demucs
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Erro no Demucs: {result.stderr}")
            return jsonify({'error': f'Erro na separação: {result.stderr}'}), 500
        
        # Localizar os stems gerados
        demucs_output = os.path.join(STEMS_FOLDER, 'htdemucs', song_name)
        
        if not os.path.exists(demucs_output):
            return jsonify({'error': 'Stems não foram gerados corretamente'}), 500
        
        # Listar stems disponíveis
        stems_info = []
        for stem_file in os.listdir(demucs_output):
            if stem_file.endswith('.wav'):
                stem_name = Path(stem_file).stem
                stems_info.append({
                    'name': stem_name,
                    'path': os.path.join(demucs_output, stem_file),
                    'url': f'/api/download/{song_name}/{stem_name}'
                })
        
        print(f"Separação concluída! {len(stems_info)} stems criados.")
        
        return jsonify({
            'status': 'success',
            'message': 'Stems separados com sucesso!',
            'stems': stems_info,
            'original': filename
        })
        
    except Exception as e:
        print(f"Erro na separação: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chords', methods=['POST'])
def detect_chords():
    """Detecta acordes no áudio usando autochord (se disponível) ou análise de chroma"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        print(f"Detectando acordes em: {filename}")
        
        # Tentar usar autochord primeiro (melhor qualidade)
        chords, method = detect_chords_with_autochord(filepath)
        
        print(f"Detecção concluída com {method}! {len(chords)} acordes encontrados.")
        
        return jsonify({
            'status': 'success',
            'chords': chords,
            'method': method,
            'total': len(chords)
        })
        
    except Exception as e:
        print(f"Erro na detecção: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/full-analysis', methods=['POST'])
def full_analysis():
    """Faz análise completa: separa stems E detecta acordes"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Gerar task ID único
        task_id = f"analysis_{int(time.time())}"
        
        print(f"=== ANÁLISE COMPLETA: {filename} ===")
        update_progress(task_id, 1, f"Iniciando análise de {filename}...", 5)
        
        # 1. Separar stems com Demucs
        print("Passo 1/2: Separando instrumentos com Demucs...")
        update_progress(task_id, 2, "Separando instrumentos com Demucs...", 10)
        
        song_name = Path(filename).stem
        
        # Comando Demucs via Python
        import sys
        cmd = [
            sys.executable, '-m', 'demucs',
            '-n', 'htdemucs',
            '--out', STEMS_FOLDER,
            filepath
        ]
        
        update_progress(task_id, 3, "Executando Demucs (pode demorar alguns minutos)...", 20)
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Erro no Demucs: {result.stderr}")
            update_progress(task_id, -1, f"Erro na separação: {result.stderr}", 0)
            return jsonify({'error': f'Erro na separação: {result.stderr}', 'task_id': task_id}), 500
        
        update_progress(task_id, 4, "Stems gerados, processando arquivos...", 60)
        
        # Localizar stems
        demucs_output = os.path.join(STEMS_FOLDER, 'htdemucs', song_name)
        stems_info = []
        
        if os.path.exists(demucs_output):
            for stem_file in os.listdir(demucs_output):
                if stem_file.endswith('.wav'):
                    stem_name = Path(stem_file).stem
                    stems_info.append({
                        'name': stem_name,
                        'url': f'/api/download/{song_name}/{stem_name}'
                    })
        
        # 2. Detectar acordes
        print("Passo 2/2: Detectando acordes...")
        update_progress(task_id, 5, "Detectando acordes...", 80)
        
        # Tentar usar o stem "other" (harmonia) se existir
        harmony_stem = os.path.join(demucs_output, 'other.wav')
        
        if os.path.exists(harmony_stem):
            chords, method = detect_chords_with_autochord(harmony_stem)
        else:
            chords, method = detect_chords_with_autochord(filepath)
        
        update_progress(task_id, 6, "Finalizando análise...", 95)
        
        # Adicionar ao histórico com dados completos
        y, sr = librosa.load(filepath, duration=10)  # Só para pegar duração
        duration = len(y) / sr
        add_to_history(filename, len(stems_info), len(chords), duration, stems_info, chords)
        
        update_progress(task_id, 7, "Análise completa finalizada!", 100)
        
        print(f"=== ANÁLISE CONCLUÍDA ===")
        print(f"Stems: {len(stems_info)} | Acordes: {len(chords)} | Método: {method}")
        
        return jsonify({
            'status': 'success',
            'stems': stems_info,
            'chords': chords,
            'method': method,
            'message': 'Análise completa finalizada!',
            'task_id': task_id
        })
        
    except Exception as e:
        print(f"Erro na análise: {str(e)}")
        import traceback
        traceback.print_exc()
        if 'task_id' in locals():
            update_progress(task_id, -1, f"Erro: {str(e)}", 0)
        return jsonify({'error': str(e), 'task_id': task_id if 'task_id' in locals() else None}), 500

@app.route('/api/download/<song>/<stem>', methods=['GET'])
def download_stem(song, stem):
    """Download de um stem específico"""
    try:
        stem_path = os.path.join(STEMS_FOLDER, 'htdemucs', song, f'{stem}.wav')
        if os.path.exists(stem_path):
            return send_file(stem_path, mimetype='audio/wav')
        else:
            return jsonify({'error': 'Stem não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def detect_chords_with_autochord(audio_path):
    """
    Detecta acordes usando análise chroma otimizada
    Retorna: (lista_de_acordes, método_usado)
    """
    print("  → Usando análise chroma otimizada")
    return analyze_chords_chroma_enhanced(audio_path), 'chroma_enhanced'

def analyze_chords_chroma_enhanced(audio_path):
    """
    Detecção de acordes OTIMIZADA usando análise de chroma
    Melhorias: melhor detecção de qualidade, acordes com sétima, filtros de ruído
    """
    try:
        # Carregar áudio (limitar a 3 minutos para performance)
        y, sr = librosa.load(audio_path, duration=180, sr=22050)
        
        # Extrair chroma com melhor resolução
        chroma = librosa.feature.chroma_cqt(
            y=y, 
            sr=sr, 
            hop_length=2048,
            bins_per_octave=36  # Maior resolução
        )
        
        # Notas da escala cromática
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Segmentos de 2 segundos
        hop_length = 2048
        frames_per_segment = int(2 * sr / hop_length)
        
        chords = []
        prev_chord = None
        
        for i in range(0, chroma.shape[1], frames_per_segment):
            segment = chroma[:, i:i+frames_per_segment]
            if segment.shape[1] == 0:
                continue
            
            # Média e normalização
            chroma_mean = segment.mean(axis=1)
            chroma_mean = chroma_mean / (chroma_mean.max() + 1e-6)
            
            # Threshold para considerar nota presente
            threshold = 0.3
            active_notes = chroma_mean > threshold
            
            # Se muito poucas notas, pode ser ruído
            if active_notes.sum() < 2:
                continue
            
            # Encontrar nota fundamental (root)
            root_idx = chroma_mean.argmax()
            root_note = notes[root_idx]
            
            # Analisar intervalos para determinar qualidade
            third_major_idx = (root_idx + 4) % 12
            third_minor_idx = (root_idx + 3) % 12
            fifth_idx = (root_idx + 7) % 12
            seventh_major_idx = (root_idx + 11) % 12
            seventh_minor_idx = (root_idx + 10) % 12
            
            # Pesos das notas
            third_major = chroma_mean[third_major_idx]
            third_minor = chroma_mean[third_minor_idx]
            fifth = chroma_mean[fifth_idx]
            seventh_major = chroma_mean[seventh_major_idx]
            seventh_minor = chroma_mean[seventh_minor_idx]
            
            # Determinar qualidade do acorde
            has_fifth = fifth > 0.4
            has_seventh_maj = seventh_major > 0.4
            has_seventh_min = seventh_minor > 0.4
            
            # Lógica de detecção melhorada
            if third_major > third_minor + 0.1:
                # Acorde maior
                if has_seventh_maj:
                    chord_quality = 'maj7'
                elif has_seventh_min:
                    chord_quality = '7'
                else:
                    chord_quality = 'maj'
            elif third_minor > third_major + 0.1:
                # Acorde menor
                if has_seventh_min:
                    chord_quality = 'min7'
                elif has_seventh_maj:
                    chord_quality = 'minmaj7'
                else:
                    chord_quality = 'min'
            else:
                # Ambíguo, usar o que tem mais energia
                if third_major > 0.5:
                    chord_quality = 'maj'
                elif third_minor > 0.5:
                    chord_quality = 'min'
                else:
                    # Pode ser power chord ou acordes sus
                    if has_fifth:
                        chord_quality = '5'  # Power chord
                    else:
                        chord_quality = 'maj'  # Default
            
            chord_name = f'{root_note}:{chord_quality}'
            
            # Timestamps
            start_time = i * hop_length / sr
            end_time = min((i + frames_per_segment) * hop_length / sr, len(y) / sr)
            
            # Evitar duplicatas consecutivas
            if chord_name != prev_chord:
                chords.append({
                    'start': float(start_time),
                    'end': float(end_time),
                    'chord': chord_name
                })
                prev_chord = chord_name
            else:
                # Estender acorde anterior
                if chords:
                    chords[-1]['end'] = float(end_time)
        
        print(f"  → Detectados {len(chords)} acordes únicos")
        return chords
        
    except Exception as e:
        print(f"  → Erro na análise: {str(e)}")
        # Fallback para versão básica
        return analyze_chords_chroma(audio_path)

def analyze_chords_chroma(audio_path):
    """
    Detecção de acordes usando análise de chroma features
    Retorna lista de acordes com timestamps
    """
    try:
        y, sr = librosa.load(audio_path, duration=180)  # Limitar a 3 minutos para testes
        
        # Extrair chroma features (12 notas cromáticas)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=2048)
        
        # Notas da escala cromática
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Dividir em segmentos de 2 segundos
        hop_length = 2048
        frames_per_segment = int(2 * sr / hop_length)
        
        chords = []
        prev_chord = None
        
        for i in range(0, chroma.shape[1], frames_per_segment):
            segment = chroma[:, i:i+frames_per_segment]
            if segment.shape[1] == 0:
                continue
            
            # Média do chroma neste segmento
            chroma_mean = segment.mean(axis=1)
            
            # Normalizar
            chroma_mean = chroma_mean / (chroma_mean.max() + 1e-6)
            
            # Nota predominante (root)
            root_note_idx = chroma_mean.argmax()
            root_note = notes[root_note_idx]
            
            # Detectar qualidade do acorde (maior/menor)
            # Verificar terça maior (4 semitons) vs terça menor (3 semitons)
            third_major_idx = (root_note_idx + 4) % 12
            third_minor_idx = (root_note_idx + 3) % 12
            
            third_major = chroma_mean[third_major_idx]
            third_minor = chroma_mean[third_minor_idx]
            
            # Verificar quinta (7 semitons)
            fifth_idx = (root_note_idx + 7) % 12
            has_fifth = chroma_mean[fifth_idx] > 0.5
            
            # Determinar tipo de acorde
            if third_major > third_minor and third_major > 0.5:
                if has_fifth:
                    chord_quality = 'maj'
                else:
                    chord_quality = 'maj'  # Assumir maior mesmo sem quinta clara
            elif third_minor > 0.5:
                chord_quality = 'min'
            else:
                chord_quality = 'maj'  # Default para maior
            
            chord_name = f'{root_note}:{chord_quality}'
            
            # Calcular timestamps
            start_time = i * hop_length / sr
            end_time = min((i + frames_per_segment) * hop_length / sr, len(y) / sr)
            
            # Evitar acordes duplicados consecutivos
            if chord_name != prev_chord:
                chords.append({
                    'start': float(start_time),
                    'end': float(end_time),
                    'chord': chord_name
                })
                prev_chord = chord_name
            else:
                # Estender o acorde anterior
                if chords:
                    chords[-1]['end'] = float(end_time)
        
        return chords
        
    except Exception as e:
        print(f"Erro na análise de acordes: {str(e)}")
        return []

if __name__ == '__main__':
    print("=" * 50)
    print("🎵 MUSIC ANALYZER API - DEMUCS ENGINE")
    print("=" * 50)
    print("Servidor iniciando em http://localhost:5000")
    print("\nEndpoints disponíveis:")
    print("  GET  /api/health        - Status do servidor")
    print("  POST /api/separate      - Separar stems")
    print("  POST /api/chords        - Detectar acordes")
    print("  POST /api/full-analysis - Análise completa")
    print("=" * 50)
    print("\n⚠️  IMPORTANTE:")
    print("  - Primeira execução: Demucs baixará modelos (~2GB)")
    print("  - Processamento pode levar 2-5 minutos por música")
    print("  - Detecção de acordes: análise chroma otimizada")
    print("  - Tipos de acordes: maj, min, 7, maj7, min7, power chords")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)