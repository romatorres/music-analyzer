# app.py - Backend Flask UPGRADE - Demucs com 2/4/6 stems e 3 qualidades
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import librosa
from pathlib import Path
import time
import json
from datetime import datetime
import threading
import sys

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURAÇÕES ====================
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
STEMS_FOLDER = 'stems'
HISTORY_FILE = 'analysis_history.json'
CACHE_FILE = 'analysis_cache.json'

for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, STEMS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

progress_data = {}
analysis_history = []
analysis_cache = {}

# ==================== CONFIGURAÇÕES DE QUALIDADE ====================

QUALITY_CONFIGS = {
    # BÁSICA: Rápido, qualidade boa (7/10) - 2-4 min
    'basic': {
        'model': 'htdemucs',
        'shifts': 0,
        'overlap': 0.25,
        'segment': 'default',
        'float32': False,
        'mp3': True,
        'mp3_bitrate': 256,
        'description': 'Rápido (Boa qualidade)',
        'time_2stems': '2-4 min',
        'time_4stems': '3-6 min',
        'time_6stems': 'N/A',
        'quality_score': '7/10'
    },
    
    # INTERMEDIÁRIA: Balanceado, qualidade ótima (8.5/10) - 5-10 min
    'intermediate': {
        'model': 'htdemucs',
        'shifts': 1,
        'overlap': 0.4,
        'segment': 'default',
        'float32': True,
        'mp3': True,
        'mp3_bitrate': 320,
        'description': 'Balanceado (Ótima qualidade)',
        'time_2stems': '5-8 min',
        'time_4stems': '8-12 min',
        'time_6stems': 'N/A',
        'quality_score': '8.5/10'
    },
    
    # MÁXIMA: Melhor qualidade possível (9.5/10) - 15-25 min
    'maximum': {
        'model': 'htdemucs',
        'shifts': 3,
        'overlap': 0.5,
        'segment': '80',
        'float32': True,
        'mp3': False,  # WAV apenas para máxima qualidade
        'mp3_bitrate': None,
        'description': 'Máxima (Perfeita qualidade)',
        'time_2stems': '10-15 min',
        'time_4stems': '15-20 min',
        'time_6stems': 'N/A',
        'quality_score': '9.5/10'
    }
}

# Configuração para 6 stems (usa modelo diferente)
QUALITY_CONFIGS_6STEMS = {
    'basic': {
        'model': 'htdemucs_6s',
        'shifts': 0,
        'overlap': 0.25,
        'mp3': True,
        'mp3_bitrate': 256,
        'time': '4-8 min'
    },
    'intermediate': {
        'model': 'htdemucs_6s',
        'shifts': 1,
        'overlap': 0.4,
        'mp3': True,
        'mp3_bitrate': 320,
        'time': '10-15 min'
    },
    'maximum': {
        'model': 'htdemucs_6s',
        'shifts': 3,
        'overlap': 0.5,
        'mp3': False,
        'time': '20-30 min'
    }
}

# ==================== FUNÇÕES AUXILIARES ====================

def load_history_from_file():
    global analysis_history
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                analysis_history = json.load(f)
                print(f"✓ Histórico: {len(analysis_history)} análises")
    except Exception as e:
        print(f"Erro ao carregar histórico: {e}")
        analysis_history = []

def save_history_to_file():
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(analysis_history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar histórico: {e}")

def load_cache_from_file():
    global analysis_cache
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                analysis_cache = json.load(f)
                print(f"✓ Cache: {len(analysis_cache)} análises")
    except Exception as e:
        print(f"Erro ao carregar cache: {e}")
        analysis_cache = {}

def save_cache_to_file():
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(analysis_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar cache: {e}")

def update_progress(task_id, step, message, percentage):
    if task_id in progress_data:
        progress_data[task_id].update({
            'step': step,
            'message': message,
            'percentage': percentage,
            'timestamp': datetime.now().isoformat()
        })
    else:
        progress_data[task_id] = {
            'step': step,
            'message': message,
            'percentage': percentage,
            'timestamp': datetime.now().isoformat()
        }
    print(f"  [{percentage}%] {message}")

def add_to_history(filename, stems_count, chords_count, duration, stems=None, chords=None):
    analysis_history.insert(0, {
        'filename': filename,
        'stems_count': stems_count,
        'chords_count': chords_count,
        'duration': duration,
        'timestamp': datetime.now().isoformat()
    })
    
    if len(analysis_history) > 20:
        analysis_history.pop()
    save_history_to_file()
    
    if stems is not None or chords is not None:
        analysis_cache[filename] = {
            'status': 'success',
            'stems': stems or [],
            'chords': chords or [],
            'filename': filename,
            'duration': duration
        }
        save_cache_to_file()

load_history_from_file()
load_cache_from_file()

# ==================== ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Music Analyzer API UPGRADE',
        'engine': 'Demucs 4.0 (2/4/6 stems + 3 qualidades)',
        'active_tasks': len(progress_data),
        'features': {
            'stems_options': [2, 4, 6],
            'quality_levels': ['basic', 'intermediate', 'maximum'],
            'models': ['htdemucs', 'htdemucs_6s']
        }
    })

@app.route('/api/debug/tasks', methods=['GET'])
def debug_tasks():
    """Lista todas as tasks ativas (debug)"""
    tasks_info = {}
    for task_id, data in progress_data.items():
        tasks_info[task_id] = {
            'percentage': data.get('percentage', 0),
            'message': data.get('message', ''),
            'has_stems': 'stems' in data,
            'stems_count': len(data.get('stems', []))
        }
    return jsonify({
        'total_tasks': len(progress_data),
        'tasks': tasks_info
    })

@app.route('/api/quality-info', methods=['GET'])
def quality_info():
    """Retorna informações sobre configurações de qualidade"""
    return jsonify({
        'qualities': {
            'basic': {
                'name': 'Básica',
                'description': QUALITY_CONFIGS['basic']['description'],
                'score': QUALITY_CONFIGS['basic']['quality_score'],
                'time_estimates': {
                    '2_stems': QUALITY_CONFIGS['basic']['time_2stems'],
                    '4_stems': QUALITY_CONFIGS['basic']['time_4stems'],
                    '6_stems': QUALITY_CONFIGS_6STEMS['basic']['time']
                }
            },
            'intermediate': {
                'name': 'Intermediária',
                'description': QUALITY_CONFIGS['intermediate']['description'],
                'score': QUALITY_CONFIGS['intermediate']['quality_score'],
                'time_estimates': {
                    '2_stems': QUALITY_CONFIGS['intermediate']['time_2stems'],
                    '4_stems': QUALITY_CONFIGS['intermediate']['time_4stems'],
                    '6_stems': QUALITY_CONFIGS_6STEMS['intermediate']['time']
                }
            },
            'maximum': {
                'name': 'Máxima',
                'description': QUALITY_CONFIGS['maximum']['description'],
                'score': QUALITY_CONFIGS['maximum']['quality_score'],
                'time_estimates': {
                    '2_stems': QUALITY_CONFIGS['maximum']['time_2stems'],
                    '4_stems': QUALITY_CONFIGS['maximum']['time_4stems'],
                    '6_stems': QUALITY_CONFIGS_6STEMS['maximum']['time']
                }
            }
        }
    })

@app.route('/api/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    try:
        if task_id in progress_data:
            return jsonify(progress_data[task_id])
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({'history': analysis_history})

@app.route('/api/analysis/<filename>', methods=['GET'])
def get_analysis(filename):
    try:
        if filename in analysis_cache:
            return jsonify(analysis_cache[filename])
        return jsonify({'error': 'Análise não encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis/<filename>', methods=['DELETE'])
def delete_analysis(filename):
    try:
        print(f"\n=== DELETANDO: {filename} ===")
        song_name = Path(filename).stem
        deleted_items = []
        
        # Deletar stems de TODOS os modelos possíveis
        for model in ['htdemucs', 'htdemucs_6s']:
            stems_path = os.path.join(STEMS_FOLDER, model, song_name)
            if os.path.exists(stems_path):
                import shutil
                shutil.rmtree(stems_path)
                deleted_items.append(f"stems ({model})")
                print(f"  ✓ Deletado: {stems_path}")
        
        # Deletar upload
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(upload_path):
            os.remove(upload_path)
            deleted_items.append("arquivo original")
        
        # Remover histórico e cache
        global analysis_history
        analysis_history = [item for item in analysis_history if item['filename'] != filename]
        save_history_to_file()
        
        if filename in analysis_cache:
            del analysis_cache[filename]
            save_cache_to_file()
        
        print(f"✓ Deletado com sucesso!")
        return jsonify({
            'status': 'success',
            'message': f'Análise deletada',
            'deleted_items': deleted_items
        })
        
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== SEPARAÇÃO DE STEMS ====================

def process_separation_async(task_id, filepath, filename, stems_mode, quality_mode):
    """Processa separação em background com configurações otimizadas"""
    try:
        song_name = Path(filename).stem.strip()
        song_name = ' '.join(song_name.split())
        
        print(f"\n{'='*60}")
        print(f"🎵 SEPARAÇÃO: {filename}")
        print(f"   Stems: {stems_mode} | Qualidade: {quality_mode}")
        print(f"{'='*60}")
        
        # Criar arquivo temporário sem espaços (bug do Demucs)
        temp_filepath = filepath
        if ' ' in song_name:
            temp_name = song_name.replace(' ', '_')
            temp_filename = f"{temp_name}{Path(filename).suffix}"
            temp_filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
            import shutil
            shutil.copy2(filepath, temp_filepath)
            song_name = temp_name
        
        update_progress(task_id, 1, f"Iniciando...", 5)
        
        # Selecionar configuração
        if stems_mode == '6':
            config = QUALITY_CONFIGS_6STEMS[quality_mode]
            model_name = 'htdemucs_6s'
        else:
            config = QUALITY_CONFIGS[quality_mode]
            model_name = config['model']
        
        # Montar comando Demucs
        cmd = [
            sys.executable, '-m', 'demucs',
            '-n', model_name,
            '--shifts', str(config['shifts']),
            '--overlap', str(config['overlap']),
            '--jobs', '0',
            '--device', 'cpu'
        ]
        
        # Float32 (mais preciso)
        if config.get('float32', False):
            cmd.append('--float32')
        
        # Segment (para máxima qualidade)
        if config.get('segment') and config['segment'] != 'default':
            cmd.extend(['--segment', config['segment']])
        
        # MP3 output (menor tamanho)
        if config.get('mp3', False):
            cmd.append('--mp3')
            if config.get('mp3_bitrate'):
                cmd.extend(['--mp3-bitrate', str(config['mp3_bitrate'])])
        
        # 2 stems (vocals + instrumental)
        if stems_mode == '2':
            cmd.extend(['--two-stems', 'vocals'])
        
        cmd.extend(['--out', STEMS_FOLDER, temp_filepath])
        
        # Estimativa de tempo
        if stems_mode == '6':
            time_estimate = config['time']
        else:
            time_key = f'time_{stems_mode}stems'
            time_estimate = config.get(time_key, '5-10 min')
        
        print(f"\n🔧 Configuração:")
        print(f"   Modelo: {model_name}")
        print(f"   Shifts: {config['shifts']} | Overlap: {config['overlap']}")
        print(f"   Tempo estimado: {time_estimate}")
        print(f"   Comando: {' '.join(cmd)}\n")
        
        update_progress(task_id, 2, f"Processando ({quality_mode}) - {time_estimate}", 20)
        
        start_time = time.time()
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Monitorar progresso em tempo real
        stderr_output = []
        stdout_output = []
        last_progress = 20
        max_wait_after_100 = 30  # Esperar 30s após 100%
        time_at_100 = None
        
        print("Monitorando progresso do Demucs...")
        while True:
            # Ler stderr (onde o Demucs mostra progresso)
            stderr_line = process.stderr.readline() if process.stderr else None
            if stderr_line:
                stderr_output.append(stderr_line)
                # Procurar por porcentagem no output
                if '%|' in stderr_line:
                    try:
                        # Extrair porcentagem (ex: "  15%|###...")
                        percent_str = stderr_line.strip().split('%')[0].strip()
                        if percent_str.isdigit():
                            demucs_percent = int(percent_str)
                            # Mapear 0-100% do Demucs para 20-80% do nosso progresso
                            our_percent = 20 + int(demucs_percent * 0.6)
                            if our_percent > last_progress:
                                last_progress = our_percent
                                update_progress(task_id, 3, f"Processando: {demucs_percent}%", our_percent)
                            
                            # Marcar quando chegou a 100%
                            if demucs_percent >= 100 and time_at_100 is None:
                                time_at_100 = time.time()
                                print("Demucs chegou a 100%, aguardando finalização...")
                    except Exception as e:
                        pass
            
            # Verificar se processo terminou
            poll_result = process.poll()
            if poll_result is not None:
                print(f"Processo Demucs terminou com código: {poll_result}")
                # Ler qualquer saída restante
                if process.stdout:
                    remaining_stdout = process.stdout.readlines()
                    stdout_output.extend(remaining_stdout)
                if process.stderr:
                    remaining_stderr = process.stderr.readlines()
                    stderr_output.extend(remaining_stderr)
                break
            
            # Timeout: se chegou a 100% há mais de X segundos, forçar saída
            if time_at_100 is not None:
                elapsed_since_100 = time.time() - time_at_100
                if elapsed_since_100 > max_wait_after_100:
                    print(f"TIMEOUT: Processo não finalizou após {max_wait_after_100}s em 100%")
                    print("Forçando continuação...")
                    # Tentar terminar o processo
                    try:
                        process.terminate()
                        time.sleep(1)
                        if process.poll() is None:
                            process.kill()
                    except:
                        pass
                    break
            
            # Pequeno delay para não sobrecarregar CPU
            time.sleep(0.1)
        
        elapsed = time.time() - start_time
        result_code = process.returncode
        
        stdout_text = ''.join(stdout_output)
        stderr_text = ''.join(stderr_output)
        
        print(f"\nDemucs finalizado às {datetime.now().strftime('%H:%M:%S')}")
        print(f"Tempo decorrido: {elapsed:.1f}s")
        print(f"Return code: {result_code}")
        
        # Debug: verificar se há mensagens de erro específicas
        if result_code != 0:
            print(f"\n⚠️  AVISO: Demucs retornou código de erro {result_code}")
            stderr_lower = stderr_text.lower()
            if "out of memory" in stderr_lower or "memory" in stderr_lower:
                print("  ❌ ERRO DE MEMÓRIA detectado!")
            if "permission" in stderr_lower:
                print("  ❌ ERRO DE PERMISSÃO detectado!")
            if "no space" in stderr_lower or "disk" in stderr_lower:
                print("  ❌ ERRO DE ESPAÇO EM DISCO detectado!")
        
        # IMPORTANTE: Mesmo com erro, verificar se stems foram gerados
        print(f"\n{'='*60}")
        print("Localizando diretório de stems...")
        print(f"{'='*60}")
        
        # Localizar pasta de stems (suporta htdemucs e htdemucs_6s)
        stems_base = os.path.join(STEMS_FOLDER, model_name, song_name)
        
        print(f"Procurando em: {stems_base}")
        
        if not os.path.exists(stems_base):
            print(f"✗ Erro: Pasta não encontrada: {stems_base}")
            
            # Listar o que existe
            model_dir = os.path.join(STEMS_FOLDER, model_name)
            if os.path.exists(model_dir):
                print(f"\nConteúdo de {model_dir}:")
                for item in os.listdir(model_dir):
                    print(f"  - '{item}'")
            
            update_progress(task_id, -1, "Pasta de stems não criada", 0)
            return
        
        update_progress(task_id, 3, "Processando stems...", 80)
        
        # Listar stems
        files = os.listdir(stems_base)
        
        # VERIFICAÇÃO CRÍTICA: Pasta existe mas está vazia?
        if len(files) == 0:
            print(f"\n✗ ERRO CRÍTICO: Pasta criada mas está VAZIA!")
            print(f"  Diretório: {stems_base}")
            print(f"  Arquivos: {files}")
            update_progress(task_id, -1, "Demucs não gerou arquivos (pasta vazia)", 0)
            return
        
        print(f"✓ Encontrados {len(files)} arquivos")
        
        stems_info = []
        stem_names_added = set()
        
        stem_translations = {
            "vocals": "Vocal",
            "drums": "Bateria",
            "bass": "Baixo",
            "other": "Outros",
            "guitar": "Guitarra",
            "piano": "Piano",
            "instrumental": "Instrumental"
        }
        
        # Priorizar WAV, depois MP3
        for ext in ['.wav', '.mp3']:
            for stem_file in files:
                if stem_file.endswith(ext):
                    stem_name = Path(stem_file).stem
                    if stem_name not in stem_names_added:
                        translated = stem_translations.get(stem_name, stem_name)
                        stems_info.append({
                            'name': translated,
                            'url': f'/api/download/{model_name}/{song_name}/{stem_name}'
                        })
                        stem_names_added.add(stem_name)
        
        # Duração
        try:
            y, sr = librosa.load(filepath, duration=10)
            duration = len(y) / sr
            print(f"✓ Duração: {duration:.2f}s")
        except:
            duration = 0
        
        # IMPORTANTE: Salvar stems ANTES de atualizar para 100%
        # para evitar race condition com o frontend
        print("\nSalvando resultado no progress_data...")
        progress_data[task_id]['stems'] = stems_info
        progress_data[task_id]['processing_time'] = elapsed
        progress_data[task_id]['model_used'] = model_name
        print(f"✓ Dados salvos! Stems disponíveis: {len(stems_info)}")
        
        # Agora sim, atualizar para 100%
        update_progress(task_id, 4, f"Concluído! {len(stems_info)} stems", 100)
        print(f"✓ Progresso atualizado para 100%!")
        
        # Adicionar ao histórico
        add_to_history(filename, len(stems_info), 0, duration, stems_info, None)
        
        # Limpar temporário
        if temp_filepath != filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
            print(f"✓ Arquivo temporário removido")
        
        print(f"\n{'='*60}")
        print(f"✓ SEPARAÇÃO CONCLUÍDA COM SUCESSO!")
        print(f"  Tempo: {elapsed:.1f}s")
        print(f"  Stems: {len(stems_info)}")
        print(f"  Modelo: {model_name}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n✗ Erro: {e}\n")
        import traceback
        traceback.print_exc()
        update_progress(task_id, -1, f"Erro: {str(e)}", 0)

@app.route('/api/separate', methods=['POST'])
def separate_audio():
    """Endpoint para separação com validação de parâmetros"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Arquivo não enviado'}), 400
        
        file = request.files['audio']
        if not file.filename:
            return jsonify({'error': 'Nome vazio'}), 400
        
        # Parâmetros
        stems_mode = request.form.get('stems_mode', '4')
        quality_mode = request.form.get('quality_mode', 'intermediate')
        
        # Validações
        if stems_mode not in ['2', '4', '6']:
            stems_mode = '4'
        if quality_mode not in ['basic', 'intermediate', 'maximum']:
            quality_mode = 'intermediate'
        
        task_id = f"separate_{int(time.time() * 1000)}"
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        update_progress(task_id, 0, "Iniciando...", 0)
        
        thread = threading.Thread(
            target=process_separation_async,
            args=(task_id, filepath, filename, stems_mode, quality_mode)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'processing',
            'task_id': task_id,
            'stems_mode': stems_mode,
            'quality_mode': quality_mode
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== DETECÇÃO DE ACORDES ====================

def convert_chord_notation(harte_chord):
    """Converte notação Harte para notação tradicional"""
    if ':' not in harte_chord:
        return harte_chord
    
    root, quality = harte_chord.split(':', 1)
    
    quality_map = {
        'maj': '', 'min': 'm', 'maj7': 'maj7', 'min7': 'm7',
        '7': '7', 'dim': '°', 'aug': '+', 'sus2': 'sus2',
        'sus4': 'sus4', '5': '5', 'maj6': '6', 'min6': 'm6',
        '9': '9', 'maj9': 'maj9', 'min9': 'm9', '11': '11',
        '13': '13', 'dim7': '°7', 'hdim7': 'ø7', 'minmaj7': 'm(maj7)',
    }
    
    converted_quality = quality_map.get(quality, quality)
    return f"{root}{converted_quality}"

def detect_chords_with_crema(audio_path):
    """Detecta acordes usando CREMA (Deep Learning)"""
    try:
        import crema
        import numpy as np
        
        print("✓ CREMA carregado com sucesso!")
        print("🎵 Usando CREMA (Deep Learning)...")
        model = crema.models.chord.ChordModel()
        chord_annotation = model.predict(filename=audio_path)
        
        chords = []
        prev_chord = None
        
        for observation in chord_annotation.data:
            chord_label = observation.value
            
            if chord_label == 'N' or chord_label == 'X':
                continue
            
            start_time = float(observation.time)
            end_time = float(observation.time + observation.duration)
            chord_name = convert_chord_notation(chord_label)
            
            if chord_name != prev_chord:
                chords.append({
                    'start': start_time,
                    'end': end_time,
                    'chord': chord_name
                })
                prev_chord = chord_name
            else:
                if chords:
                    chords[-1]['end'] = end_time
        
        print(f"✓ CREMA detectou {len(chords)} acordes")
        return chords, 'crema'
        
    except ImportError as e:
        print(f"⚠️  CREMA não instalado: {e}")
        return detect_chords_chroma(audio_path), 'chroma_enhanced'
    except Exception as e:
        print(f"❌ Erro com CREMA: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return detect_chords_chroma(audio_path), 'chroma_enhanced'

def detect_chords_chroma(audio_path):
    """Detecção de acordes usando análise de chroma (fallback)"""
    try:
        y, sr = librosa.load(audio_path, duration=180, sr=22050)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=2048, bins_per_octave=36)
        
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        hop_length = 2048
        frames_per_segment = int(2 * sr / hop_length)
        
        chords = []
        prev_chord = None
        
        for i in range(0, chroma.shape[1], frames_per_segment):
            segment = chroma[:, i:i+frames_per_segment]
            if segment.shape[1] == 0:
                continue
            
            chroma_mean = segment.mean(axis=1)
            chroma_mean = chroma_mean / (chroma_mean.max() + 1e-6)
            
            threshold = 0.3
            active_notes = chroma_mean > threshold
            
            if active_notes.sum() < 2:
                continue
            
            root_idx = chroma_mean.argmax()
            root_note = notes[root_idx]
            
            third_major_idx = (root_idx + 4) % 12
            third_minor_idx = (root_idx + 3) % 12
            fifth_idx = (root_idx + 7) % 12
            
            third_major = chroma_mean[third_major_idx]
            third_minor = chroma_mean[third_minor_idx]
            fifth = chroma_mean[fifth_idx]
            
            if third_major > third_minor + 0.1:
                chord_quality = 'maj'
            elif third_minor > third_major + 0.1:
                chord_quality = 'min'
            else:
                chord_quality = '5' if fifth > 0.4 else 'maj'
            
            harte_notation = f'{root_note}:{chord_quality}'
            chord_name = convert_chord_notation(harte_notation)
            
            start_time = i * hop_length / sr
            end_time = min((i + frames_per_segment) * hop_length / sr, len(y) / sr)
            
            if chord_name != prev_chord:
                chords.append({
                    'start': float(start_time),
                    'end': float(end_time),
                    'chord': chord_name
                })
                prev_chord = chord_name
            else:
                if chords:
                    chords[-1]['end'] = float(end_time)
        
        return chords
        
    except Exception as e:
        print(f"Erro na análise: {str(e)}")
        return []

@app.route('/api/chords', methods=['POST'])
def detect_chords():
    """Detecta acordes no áudio"""
    task_id = None
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'Nome de arquivo vazio'}), 400
        
        task_id = f"chords_{int(time.time() * 1000)}"
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        print(f"\n=== DETECÇÃO DE ACORDES: {filename} ===")
        update_progress(task_id, 1, f"Iniciando detecção em {filename}...", 10)
        
        update_progress(task_id, 2, "Analisando harmonia...", 30)
        
        # Detectar acordes
        chords, method = detect_chords_with_crema(filepath)
        
        update_progress(task_id, 3, f"{len(chords)} acordes detectados!", 100)
        
        # Adicionar ao histórico
        try:
            y, sr = librosa.load(filepath, duration=10)
            duration = len(y) / sr
        except:
            duration = 0
            
        add_to_history(filename, 0, len(chords), duration, None, chords)
        
        print(f"✓ Detecção concluída - {len(chords)} acordes ({method})")
        
        return jsonify({
            'status': 'success',
            'chords': chords,
            'method': method,
            'task_id': task_id,
            'total': len(chords)
        })
        
    except Exception as e:
        print(f"Erro na detecção: {str(e)}")
        if task_id:
            update_progress(task_id, -1, f"Erro: {str(e)}", 0)
        return jsonify({
            'error': str(e),
            'task_id': task_id
        }), 500

# ==================== DOWNLOAD ====================

@app.route('/api/download/<model>/<song>/<stem>', methods=['GET'])
def download_stem(model, song, stem):
    """Download com suporte a múltiplos modelos"""
    try:
        for ext in ['.wav', '.mp3']:
            path = os.path.join(STEMS_FOLDER, model, song, f'{stem}{ext}')
            if os.path.exists(path):
                mime = 'audio/wav' if ext == '.wav' else 'audio/mpeg'
                return send_file(path, mimetype=mime)
        return jsonify({'error': 'Stem não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    try:
        from urllib.parse import unquote
        decoded = unquote(filename)
        path = os.path.join(UPLOAD_FOLDER, decoded)
        
        if os.path.exists(path):
            ext = decoded.lower().split('.')[-1]
            mimes = {
                'mp3': 'audio/mpeg',
                'wav': 'audio/wav',
                'ogg': 'audio/ogg',
                'm4a': 'audio/mp4'
            }
            return send_file(path, mimetype=mimes.get(ext, 'audio/mpeg'))
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== INICIALIZAÇÃO ====================

if __name__ == '__main__':
    print("=" * 70)
    print("🎵 MUSIC ANALYZER API - UPGRADE v2.0")
    print("=" * 70)
    print("✨ RECURSOS:")
    print("   • Stems: 2 (vocals+inst), 4 (padrão) ou 6 (piano+guitarra)")
    print("   • Qualidade: Básica (rápido), Intermediária, Máxima (perfeita)")
    print("   • Acordes: CREMA Deep Learning (90-95% precisão)")
    print("   • Modelos: htdemucs (2/4 stems) e htdemucs_6s (6 stems)")
    print("\n⏱️  TEMPOS ESTIMADOS:")
    print("   Básica:        2-4 min (2s) | 3-6 min (4s) | 4-8 min (6s)")
    print("   Intermediária: 5-8 min (2s) | 8-12 min (4s) | 10-15 min (6s)")
    print("   Máxima:        10-15 min (2s) | 15-20 min (4s) | 20-30 min (6s)")
    print("\n📡 ENDPOINTS:")
    print("   GET  /api/health        - Status do servidor")
    print("   GET  /api/quality-info  - Info sobre qualidades")
    print("   POST /api/separate      - Separar stems")
    print("   POST /api/chords        - Detectar acordes")
    print("   GET  /api/progress/:id  - Progresso de tarefa")
    print("=" * 70)
    print(f"\n🚀 Servidor: http://localhost:5000\n")
    
    app.run(debug=False, host='0.0.0.0', port=5000)