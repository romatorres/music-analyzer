# app.py - Backend Flask para análise musical com Demucs
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

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURAÇÕES ====================
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
STEMS_FOLDER = 'stems'
HISTORY_FILE = 'analysis_history.json'
CACHE_FILE = 'analysis_cache.json'

# Criar diretórios
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, STEMS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Dados globais
progress_data = {}
analysis_history = []
analysis_cache = {}

# ==================== FUNÇÕES AUXILIARES ====================

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

def update_progress(task_id, step, message, percentage):
    """Atualiza o progresso de uma tarefa"""
    progress_data[task_id] = {
        'step': step,
        'message': message,
        'percentage': percentage,
        'timestamp': datetime.now().isoformat()
    }
    print(f"  [{percentage}%] {message}")

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
    
    save_history_to_file()
    
    # Salvar dados completos no cache
    if stems is not None or chords is not None:
        analysis_cache[filename] = {
            'status': 'success',
            'stems': stems or [],
            'chords': chords or [],
            'filename': filename,
            'duration': duration
        }
        save_cache_to_file()

# Carregar dados ao iniciar
load_history_from_file()
load_cache_from_file()

# ==================== ENDPOINTS DE STATUS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica se o servidor está rodando"""
    return jsonify({
        'status': 'ok',
        'message': 'Music Analyzer API está rodando!',
        'engine': 'Demucs 4.0 (Otimizado)'
    })

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
        if filename in analysis_cache:
            return jsonify(analysis_cache[filename])
        return jsonify({'error': 'Análise não encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis/<filename>', methods=['DELETE'])
def delete_analysis(filename):
    """Deleta uma análise do histórico e seus arquivos físicos"""
    try:
        print(f"\n=== DELETANDO ANÁLISE: {filename} ===")
        
        song_name = Path(filename).stem
        deleted_items = []
        
        # 1. Deletar stems (htdemucs_ft)
        stems_path_ft = os.path.join(STEMS_FOLDER, 'htdemucs_ft', song_name)
        if os.path.exists(stems_path_ft):
            import shutil
            shutil.rmtree(stems_path_ft)
            deleted_items.append(f"stems (htdemucs_ft)")
            print(f"  ✓ Deletado: {stems_path_ft}")
        
        # 2. Deletar stems (htdemucs - versão antiga)
        stems_path_old = os.path.join(STEMS_FOLDER, 'htdemucs', song_name)
        if os.path.exists(stems_path_old):
            import shutil
            shutil.rmtree(stems_path_old)
            deleted_items.append(f"stems (htdemucs)")
            print(f"  ✓ Deletado: {stems_path_old}")
        
        # 3. Deletar arquivo de upload
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(upload_path):
            os.remove(upload_path)
            deleted_items.append("arquivo original")
            print(f"  ✓ Deletado: {upload_path}")
        
        # 4. Remover do histórico
        global analysis_history
        analysis_history = [item for item in analysis_history if item['filename'] != filename]
        save_history_to_file()
        deleted_items.append("histórico")
        print(f"  ✓ Removido do histórico")
        
        # 5. Remover do cache
        if filename in analysis_cache:
            del analysis_cache[filename]
            save_cache_to_file()
            deleted_items.append("cache")
            print(f"  ✓ Removido do cache")
        
        print(f"✓ Análise deletada com sucesso!")
        
        return jsonify({
            'status': 'success',
            'message': f'Análise de "{filename}" deletada com sucesso',
            'deleted_items': deleted_items
        })
        
    except Exception as e:
        print(f"Erro ao deletar análise: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== SEPARAÇÃO DE STEMS ====================

def process_separation_async(task_id, filepath, filename, stems_mode, duration_limit):
    """Processa a separação de stems em background"""
    try:
        song_name = Path(filename).stem
        
        print(f"\n=== SEPARAÇÃO DE STEMS: {filename} (modo: {stems_mode} stems) ===")
        update_progress(task_id, 1, f"Iniciando separação de {filename}...", 5)
        
        # Comando Demucs - VERSÃO ESTÁVEL
        import sys
        
        # Construir comando baseado na escolha do usuário
        cmd = [
            sys.executable, '-m', 'demucs',
            '-n', 'htdemucs',
            '--device', 'cpu',     # Forçar CPU (já que não tem GPU)
            '--jobs', '1',         # Usar apenas 1 job (mais estável)
        ]
        
        # Adicionar flag de 2 stems se escolhido
        if stems_mode == '2':
            cmd.extend(['--two-stems', 'vocals'])
            estimated_time = "3-5 min"
        else:
            estimated_time = "8-12 min"
        
        # Adicionar limite de duração se especificado (para testes)
        if duration_limit:
            cmd.extend(['--segment', duration_limit])
            estimated_time = "1-2 min (preview)"
        
        # Adicionar output e arquivo
        cmd.extend(['--out', STEMS_FOLDER, filepath])
        
        print("Comando:", ' '.join(cmd))
        update_progress(task_id, 2, f"Processando com Demucs ({estimated_time})...", 20)
        
        print(f"Iniciando Demucs às {datetime.now().strftime('%H:%M:%S')}")
        print("Aguarde... (primeira execução pode baixar modelos ~2GB)")
        
        start_time = time.time()
        
        # Executar Demucs com captura de progresso em tempo real
        import subprocess
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
                    except:
                        pass
            
            # Verificar se processo terminou
            if process.poll() is not None:
                # Ler qualquer saída restante
                if process.stdout:
                    stdout_output.extend(process.stdout.readlines())
                if process.stderr:
                    stderr_output.extend(process.stderr.readlines())
                break
        
        elapsed_time = time.time() - start_time
        result_code = process.returncode
        
        stdout_text = ''.join(stdout_output)
        stderr_text = ''.join(stderr_output)
        
        print(f"Demucs finalizado às {datetime.now().strftime('%H:%M:%S')}")
        print(f"Tempo decorrido: {elapsed_time:.1f}s")
        print(f"Return code: {result_code}")
        
        if result_code != 0:
            print(f"Erro no Demucs: {stderr_text[:500]}")
            update_progress(task_id, -1, f"Erro na separação", 0)
            return
        
        update_progress(task_id, 3, "Processando stems gerados...", 80)
        
        # Localizar stems gerados (htdemucs padrão)
        demucs_output = os.path.join(STEMS_FOLDER, 'htdemucs', song_name)
        
        print(f"Procurando stems em: {demucs_output}")
        
        if not os.path.exists(demucs_output):
            print(f"Diretório não existe: {demucs_output}")
            update_progress(task_id, -1, "Stems não foram gerados", 0)
            return
        
        # Listar stems disponíveis (evitar duplicatas - priorizar WAV)
        stems_info = []
        stem_names_added = set()
        
        # Primeiro, adicionar todos os WAV
        for stem_file in os.listdir(demucs_output):
            if stem_file.endswith('.wav'):
                stem_name = Path(stem_file).stem
                if stem_name not in stem_names_added:
                    stems_info.append({
                        'name': stem_name,
                        'url': f'/api/download/{song_name}/{stem_name}'
                    })
                    stem_names_added.add(stem_name)
        
        # Depois, adicionar MP3 apenas se não houver WAV correspondente
        for stem_file in os.listdir(demucs_output):
            if stem_file.endswith('.mp3'):
                stem_name = Path(stem_file).stem
                if stem_name not in stem_names_added:
                    stems_info.append({
                        'name': stem_name,
                        'url': f'/api/download/{song_name}/{stem_name}'
                    })
                    stem_names_added.add(stem_name)
        
        update_progress(task_id, 4, f"Concluído! {len(stems_info)} stems criados", 100)
        
        print(f"Stems criados: {[s['name'] for s in stems_info]}")
        
        # Adicionar ao histórico
        y, sr = librosa.load(filepath, duration=10)
        duration = len(y) / sr
        add_to_history(filename, len(stems_info), 0, duration, stems_info, None)
        
        # Salvar resultado no progress_data para o frontend buscar
        progress_data[task_id]['stems'] = stems_info
        progress_data[task_id]['processing_time'] = elapsed_time
        progress_data[task_id]['stems_mode'] = stems_mode
        
        print(f"✓ Separação concluída em {elapsed_time:.1f}s - {len(stems_info)} stems (modo: {stems_mode})")
        
    except Exception as e:
        print(f"Erro na separação: {str(e)}")
        import traceback
        traceback.print_exc()
        update_progress(task_id, -1, f"Erro: {str(e)}", 0)

@app.route('/api/separate', methods=['POST'])
def separate_audio():
    """Separa o áudio em stems usando Demucs (processamento assíncrono)"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'Nome de arquivo vazio'}), 400
        
        # Obter opção de stems (2 ou 4)
        stems_mode = request.form.get('stems_mode', '2')  # Default: 2 stems
        
        # Opção para processar apenas parte do áudio (para testes rápidos)
        duration_limit = request.form.get('duration', None)  # Em segundos
        
        # Gerar task ID único
        task_id = f"separate_{int(time.time() * 1000)}"
        
        # Salvar arquivo
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Inicializar progresso
        update_progress(task_id, 0, "Tarefa criada, iniciando...", 0)
        
        # Iniciar processamento em background
        thread = threading.Thread(
            target=process_separation_async,
            args=(task_id, filepath, filename, stems_mode, duration_limit)
        )
        thread.daemon = True
        thread.start()
        
        # Retornar imediatamente com task_id
        return jsonify({
            'status': 'processing',
            'message': 'Separação iniciada em background',
            'task_id': task_id,
            'stems_mode': stems_mode
        })
        
    except Exception as e:
        print(f"Erro ao iniciar separação: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== DETECÇÃO DE ACORDES ====================

@app.route('/api/chords', methods=['POST'])
def detect_chords():
    """Detecta acordes no áudio (com progresso real)"""
    task_id = None
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'Nome de arquivo vazio'}), 400
        
        # Gerar task ID único
        task_id = f"chords_{int(time.time() * 1000)}"
        
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        print(f"\n=== DETECÇÃO DE ACORDES: {filename} ===")
        update_progress(task_id, 1, f"Iniciando detecção em {filename}...", 10)
        
        update_progress(task_id, 2, "Analisando harmonia...", 30)
        
        # Detectar acordes
        chords, method = detect_chords_with_autochord(filepath)
        
        update_progress(task_id, 3, f"{len(chords)} acordes detectados!", 100)
        
        # Adicionar ao histórico
        y, sr = librosa.load(filepath, duration=10)
        duration = len(y) / sr
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

# ==================== DOWNLOAD DE STEMS ====================

@app.route('/api/download/<song>/<stem>', methods=['GET'])
def download_stem(song, stem):
    """Download de um stem específico (suporta WAV e MP3)"""
    try:
        # Tentar htdemucs (padrão)
        stem_path_wav = os.path.join(STEMS_FOLDER, 'htdemucs', song, f'{stem}.wav')
        stem_path_mp3 = os.path.join(STEMS_FOLDER, 'htdemucs', song, f'{stem}.mp3')
        
        # Tentar htdemucs_ft (otimizado - se existir)
        stem_path_ft_mp3 = os.path.join(STEMS_FOLDER, 'htdemucs_ft', song, f'{stem}.mp3')
        stem_path_ft_wav = os.path.join(STEMS_FOLDER, 'htdemucs_ft', song, f'{stem}.wav')
        
        if os.path.exists(stem_path_wav):
            return send_file(stem_path_wav, mimetype='audio/wav')
        elif os.path.exists(stem_path_mp3):
            return send_file(stem_path_mp3, mimetype='audio/mpeg')
        elif os.path.exists(stem_path_ft_mp3):
            return send_file(stem_path_ft_mp3, mimetype='audio/mpeg')
        elif os.path.exists(stem_path_ft_wav):
            return send_file(stem_path_ft_wav, mimetype='audio/wav')
        else:
            return jsonify({'error': 'Stem não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ANÁLISE DE ACORDES ====================

def detect_chords_with_autochord(audio_path):
    """Detecta acordes usando análise chroma otimizada"""
    return analyze_chords_chroma_enhanced(audio_path), 'chroma_enhanced'

def analyze_chords_chroma_enhanced(audio_path):
    """Detecção de acordes OTIMIZADA usando análise de chroma"""
    try:
        # Carregar áudio (limitar a 3 minutos)
        y, sr = librosa.load(audio_path, duration=180, sr=22050)
        
        # Extrair chroma com melhor resolução
        chroma = librosa.feature.chroma_cqt(
            y=y, 
            sr=sr, 
            hop_length=2048,
            bins_per_octave=36
        )
        
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
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
            
            if active_notes.sum() < 2:
                continue
            
            # Encontrar nota fundamental
            root_idx = chroma_mean.argmax()
            root_note = notes[root_idx]
            
            # Analisar intervalos
            third_major_idx = (root_idx + 4) % 12
            third_minor_idx = (root_idx + 3) % 12
            fifth_idx = (root_idx + 7) % 12
            seventh_major_idx = (root_idx + 11) % 12
            seventh_minor_idx = (root_idx + 10) % 12
            
            third_major = chroma_mean[third_major_idx]
            third_minor = chroma_mean[third_minor_idx]
            fifth = chroma_mean[fifth_idx]
            seventh_major = chroma_mean[seventh_major_idx]
            seventh_minor = chroma_mean[seventh_minor_idx]
            
            # Determinar qualidade do acorde
            has_fifth = fifth > 0.4
            has_seventh_maj = seventh_major > 0.4
            has_seventh_min = seventh_minor > 0.4
            
            if third_major > third_minor + 0.1:
                if has_seventh_maj:
                    chord_quality = 'maj7'
                elif has_seventh_min:
                    chord_quality = '7'
                else:
                    chord_quality = 'maj'
            elif third_minor > third_major + 0.1:
                if has_seventh_min:
                    chord_quality = 'min7'
                elif has_seventh_maj:
                    chord_quality = 'minmaj7'
                else:
                    chord_quality = 'min'
            else:
                if third_major > 0.5:
                    chord_quality = 'maj'
                elif third_minor > 0.5:
                    chord_quality = 'min'
                else:
                    chord_quality = '5' if has_fifth else 'maj'
            
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
                if chords:
                    chords[-1]['end'] = float(end_time)
        
        return chords
        
    except Exception as e:
        print(f"Erro na análise: {str(e)}")
        return []

# ==================== INICIALIZAÇÃO ====================

if __name__ == '__main__':
    print("=" * 60)
    print("🎵 MUSIC ANALYZER API - DEMUCS ENGINE")
    print("=" * 60)
    print("Servidor: http://localhost:5000")
    print("\n📡 Endpoints:")
    print("  GET    /api/health          - Status do servidor")
    print("  POST   /api/separate        - Separar stems (com progresso)")
    print("  POST   /api/chords          - Detectar acordes (com progresso)")
    print("  GET    /api/progress/:id    - Consultar progresso")
    print("  GET    /api/history         - Histórico de análises")
    print("  GET    /api/analysis/:file  - Carregar análise anterior")
    print("  DELETE /api/analysis/:file  - Deletar análise e arquivos")
    print("=" * 60)
    print("\n⚡ Configuração:")
    print("  • Modelo: htdemucs (padrão, estável)")
    print("  • Stems: vocals + instrumental (2 stems)")
    print("  • Formato: WAV (alta qualidade)")
    print("  • Tempo estimado: 2-5 minutos")
    print("  • Primeira execução: baixa modelos (~2GB)")
    print("=" * 60)
    print("\n⚠️  Importante:")
    print("  • Primeira execução: baixa modelos (~2GB)")
    print("  • Progresso real via polling em /api/progress/:id")
    print("=" * 60)
    
    app.run(debug=False, host='0.0.0.0', port=5000)  # Debug desabilitado para não reiniciar
