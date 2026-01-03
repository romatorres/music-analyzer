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
    # Se task_id já existe, atualizar apenas os campos necessários
    # para não sobrescrever dados como 'stems', 'processing_time', etc.
    if task_id in progress_data:
        progress_data[task_id].update({
            'step': step,
            'message': message,
            'percentage': percentage,
            'timestamp': datetime.now().isoformat()
        })
    else:
        # Se não existe, criar novo
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
        'engine': 'Demucs 4.0 (Otimizado)',
        'active_tasks': len(progress_data)
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

@app.route('/api/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    """Retorna o progresso de uma tarefa específica"""
    try:
        if task_id in progress_data:
            data = progress_data[task_id].copy()
            # Adicionar informação de debug
            data['_debug'] = {
                'has_stems': 'stems' in progress_data[task_id],
                'keys': list(progress_data[task_id].keys()),
                'stems_count': len(progress_data[task_id].get('stems', []))
            }
            return jsonify(data)
        return jsonify({'error': 'Task not found', 'task_id': task_id}), 404
    except Exception as e:
        print(f"Erro ao buscar progresso: {e}")
        return jsonify({'error': str(e)}), 500

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

def process_separation_async(task_id, filepath, filename, stems_mode, duration_limit, quality_mode='balanced'):
    """Processa a separação de stems em background"""
    try:
        # Remover espaços extras do nome do arquivo
        song_name = Path(filename).stem.strip()
        
        print(f"\n=== SEPARAÇÃO DE STEMS: {filename} ===")
        print(f"  Modo: {stems_mode} stems | Qualidade: {quality_mode}")
        update_progress(task_id, 1, f"Iniciando separação de {filename}...", 5)
        
        # Comando Demucs com 3 modos de qualidade
        import sys
        
        # MODO 1: RÁPIDO (1-3 min) - Qualidade Boa (8.5/10)
        if quality_mode == 'fast':
            cmd = [
                sys.executable, '-m', 'demucs',
                '-n', 'htdemucs',         # Usar htdemucs padrão (já baixado)
                '--mp3',                  # Saída em MP3
                '--mp3-bitrate', '320',   # Alta qualidade
                '--float32',              # Precisão otimizada (2x mais rápido)
                '--shifts', '0',          # Sem augmentation (muito mais rápido)
                '--overlap', '0.25',      # Overlap reduzido
                '--jobs', '0',            # Usar todos os cores
                '--device', 'cpu',
            ]
            estimated_time = "3-5 min"
            quality_label = "Rápido (Boa)"
            model_name = 'htdemucs'
            
        # MODO 2: BALANCEADO (5-8 min) - Qualidade Ótima (9.0/10)
        elif quality_mode == 'balanced':
            cmd = [
                sys.executable, '-m', 'demucs',
                '-n', 'htdemucs',         # Usar htdemucs padrão
                '--mp3',                  # Saída em MP3
                '--mp3-bitrate', '320',
                '--shifts', '1',          # Pouco augmentation
                '--overlap', '0.4',       # Overlap médio
                '--jobs', '0',            # Usar todos os cores
                '--device', 'cpu',
            ]
            estimated_time = "8-12 min"
            quality_label = "Balanceado (Ótima)"
            model_name = 'htdemucs'
            
        # MODO 3: MÁXIMA QUALIDADE (15-20 min) - Qualidade Perfeita (9.5/10)
        else:  # quality_mode == 'quality'
            cmd = [
                sys.executable, '-m', 'demucs',
                '-n', 'htdemucs',         # Modelo padrão (melhor qualidade)
                '--shifts', '5',          # Máximo augmentation
                '--overlap', '0.5',       # Máximo overlap
                '--jobs', '0',            # Usar todos os cores
                '--device', 'cpu',
            ]
            estimated_time = "20-30 min"
            quality_label = "Máxima (Perfeita)"
            model_name = 'htdemucs'
        
        # Adicionar flag de 2 stems se escolhido
        if stems_mode == '2':
            cmd.extend(['--two-stems', 'vocals'])
            estimated_time = estimated_time.replace('min', 'min (2 stems)')
        else:
            estimated_time = estimated_time.replace('min', 'min (4 stems)')
        
        # Adicionar limite de duração se especificado (para testes)
        if duration_limit:
            cmd.extend(['--segment', duration_limit])
            estimated_time = "1-2 min (preview)"
        
        # Adicionar output e arquivo
        cmd.extend(['--out', STEMS_FOLDER, filepath])
        
        print("\n" + "="*60)
        print("🔧 CONFIGURAÇÃO DO DEMUCS")
        print("="*60)
        print(f"Comando: {' '.join(cmd)}")
        print(f"Qualidade: {quality_label}")
        print(f"Tempo estimado: {estimated_time}")
        print(f"Arquivo: {filepath}")
        print(f"Arquivo existe: {os.path.exists(filepath)}")
        print(f"Tamanho: {os.path.getsize(filepath) / (1024*1024):.2f} MB")
        print(f"Output folder: {STEMS_FOLDER}")
        print(f"Output existe: {os.path.exists(STEMS_FOLDER)}")
        print("="*60 + "\n")
        
        update_progress(task_id, 2, f"Processando ({quality_label}) - {estimated_time}...", 20)
        
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
        max_wait_after_100 = 10  # Esperar no máximo 10 segundos após 100%
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
                        print(f"Erro ao parsear progresso: {e}")
            
            # Verificar se processo terminou
            poll_result = process.poll()
            if poll_result is not None:
                print(f"Processo Demucs terminou com código: {poll_result}")
                # Ler qualquer saída restante
                if process.stdout:
                    remaining_stdout = process.stdout.readlines()
                    stdout_output.extend(remaining_stdout)
                    print(f"Stdout restante: {len(remaining_stdout)} linhas")
                if process.stderr:
                    remaining_stderr = process.stderr.readlines()
                    stderr_output.extend(remaining_stderr)
                    print(f"Stderr restante: {len(remaining_stderr)} linhas")
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
        
        elapsed_time = time.time() - start_time
        result_code = process.returncode
        
        stdout_text = ''.join(stdout_output)
        stderr_text = ''.join(stderr_output)
        
        print(f"Demucs finalizado às {datetime.now().strftime('%H:%M:%S')}")
        print(f"Tempo decorrido: {elapsed_time:.1f}s")
        print(f"Return code: {result_code}")
        
        # IMPORTANTE: Mesmo com erro, verificar se stems foram gerados
        # O Demucs às vezes retorna erro mas gera os stems corretamente
        print("\n" + "="*60)
        print("ETAPA 1: Localizando diretório de stems...")
        print("="*60)
        
        # Localizar stems gerados - htdemucs padrão
        # Tentar com e sem espaços no final (bug do Demucs com nomes de arquivo)
        song_name_clean = song_name.strip()
        
        print(f"Song name original: '{song_name}' (len={len(song_name)})")
        print(f"Song name limpo: '{song_name_clean}' (len={len(song_name_clean)})")
        print(f"Filename original: '{filename}'")
        print(f"Filepath: '{filepath}'")
        
        # Listar o que existe em stems/htdemucs ANTES de procurar
        htdemucs_dir = os.path.join(STEMS_FOLDER, 'htdemucs')
        print(f"\n📁 Conteúdo de {htdemucs_dir}:")
        if os.path.exists(htdemucs_dir):
            try:
                items = os.listdir(htdemucs_dir)
                if len(items) == 0:
                    print("  (vazio)")
                else:
                    for item in items:
                        item_path = os.path.join(htdemucs_dir, item)
                        is_dir = os.path.isdir(item_path)
                        print(f"  - '{item}' (len={len(item)}) {'[DIR]' if is_dir else '[FILE]'}")
                        # Se for diretório, listar conteúdo
                        if is_dir:
                            try:
                                sub_items = os.listdir(item_path)
                                if len(sub_items) == 0:
                                    print(f"      └─ (vazio)")
                                else:
                                    for sub_item in sub_items:
                                        print(f"      └─ {sub_item}")
                            except Exception as e:
                                print(f"      └─ Erro ao listar: {e}")
            except Exception as e:
                print(f"  Erro ao listar: {e}")
        else:
            print(f"  ✗ Diretório não existe!")
        
        possible_paths = [
            os.path.join(STEMS_FOLDER, 'htdemucs', song_name_clean),
            os.path.join(STEMS_FOLDER, 'htdemucs', song_name),  # Com espaços se houver
        ]
        
        demucs_output = None
        model_used = 'htdemucs'
        
        print(f"\n🔍 Tentando localizar pasta de stems:")
        # Tentar encontrar o diretório
        for path in possible_paths:
            print(f"  Tentando: {path}")
            if os.path.exists(path):
                demucs_output = path
                print(f"  ✓ Encontrado!")
                break
            else:
                print(f"  ✗ Não existe")
        
        if not demucs_output:
            print(f"\n✗ ERRO: Nenhum diretório de stems encontrado!")
            print(f"\n🔍 DEBUG - Saída completa do Demucs:")
            print(f"\n--- STDOUT ({len(stdout_text)} chars) ---")
            print(stdout_text if stdout_text else "(vazio)")
            print(f"\n--- STDERR ({len(stderr_text)} chars) ---")
            print(stderr_text if stderr_text else "(vazio)")
            print(f"\n--- COMANDO EXECUTADO ---")
            print(' '.join(cmd))
            print(f"\n--- INFORMAÇÕES DO PROCESSO ---")
            print(f"Return code: {result_code}")
            print(f"Tempo de execução: {elapsed_time:.1f}s")
            
            update_progress(task_id, -1, "Pasta de stems não foi criada", 0)
            return
        
        print(f"\n✓ Usando: {demucs_output} (modelo: {model_used})")
        print("="*60)
        
        # Se chegou aqui, stems foram gerados com sucesso
        # Ignorar return code se stems existem
        if result_code != 0:
            print(f"⚠️  Aviso: Demucs retornou código {result_code}, mas stems foram gerados com sucesso!")
        
        update_progress(task_id, 3, "Processando stems gerados...", 80)
        print("\nETAPA 2: Listando arquivos de stems...")
        print("=" * 60)
        
        # Verificar novamente se o diretório existe antes de listar
        if not os.path.exists(demucs_output):
            print(f"✗ ERRO: Diretório desapareceu: {demucs_output}")
            print(f"\n🔍 DEBUG - Saída do Demucs:")
            print(f"STDOUT:\n{stdout_text[:1000]}")
            print(f"STDERR:\n{stderr_text[:1000]}")
            update_progress(task_id, -1, "Erro ao acessar stems", 0)
            return
        
        try:
            all_files = os.listdir(demucs_output)
            print(f"  Arquivos encontrados: {all_files}")
            
            # VERIFICAÇÃO CRÍTICA: Pasta existe mas está vazia?
            if len(all_files) == 0:
                print(f"\n✗ ERRO CRÍTICO: Pasta criada mas está VAZIA!")
                print(f"  Diretório: {demucs_output}")
                print(f"  Arquivos: {all_files}")
                print(f"\n🔍 DEBUG - Saída completa do Demucs:")
                print(f"\n--- STDOUT ({len(stdout_text)} chars) ---")
                print(stdout_text)
                print(f"\n--- STDERR ({len(stderr_text)} chars) ---")
                print(stderr_text)
                print(f"\n--- COMANDO EXECUTADO ---")
                print(' '.join(cmd))
                print(f"\n--- INFORMAÇÕES DO PROCESSO ---")
                print(f"Return code: {result_code}")
                print(f"Tempo de execução: {elapsed_time:.1f}s")
                
                update_progress(task_id, -1, "Demucs não gerou arquivos (pasta vazia)", 0)
                return
                
        except Exception as e:
            print(f"✗ ERRO ao listar diretório: {e}")
            print(f"  Diretório: {demucs_output}")
            print(f"  Existe: {os.path.exists(demucs_output)}")
            print(f"  É diretório: {os.path.isdir(demucs_output)}")
            print(f"\n🔍 DEBUG - Saída do Demucs:")
            print(f"STDOUT:\n{stdout_text[:1000]}")
            print(f"STDERR:\n{stderr_text[:1000]}")
            update_progress(task_id, -1, f"Erro ao listar stems: {str(e)}", 0)
            return
        
        # Listar stems disponíveis (evitar duplicatas - priorizar WAV)
        stems_info = []
        stem_names_added = set()
        
        # TRADUÇÃO DOS STEMS
        stem_translations = {
            "vocals": "Vocal",
            "drums": "Bateria",
            "bass": "Baixo",
            "other": "Outros",
            "instrumental": "Instrumental",
            "no_vocals": "Instrumental"
        }
        
        print("\nETAPA 3: Processando arquivos WAV...")
        # Primeiro, adicionar todos os WAV
        for stem_file in all_files:
            if stem_file.endswith('.wav'):
                stem_name = Path(stem_file).stem
                translated_name = stem_translations.get(stem_name, stem_name)
                print(f"  WAV: {stem_file} → {translated_name}")
                if stem_name not in stem_names_added:
                    stems_info.append({
                        'name': translated_name,
                        'url': f'/api/download/{song_name}/{stem_name}'
                    })
                    stem_names_added.add(stem_name)
        
        print("\nETAPA 4: Processando arquivos MP3...")
        # Depois, adicionar MP3 apenas se não houver WAV correspondente
        for stem_file in all_files:
            if stem_file.endswith('.mp3'):
                stem_name = Path(stem_file).stem
                translated_name = stem_translations.get(stem_name, stem_name)
                if stem_name not in stem_names_added:
                    print(f"  MP3: {stem_file} → {translated_name}")
                    stems_info.append({
                        'name': translated_name,
                        'url': f'/api/download/{song_name}/{stem_name}'
                    })
                    stem_names_added.add(stem_name)
                else:
                    print(f"  MP3: {stem_file} → IGNORADO (já existe WAV)")
        
        print(f"\nStems finais: {[s['name'] for s in stems_info]}")
        
        print("\nETAPA 5: Obtendo duração do áudio...")
        # Adicionar ao histórico
        try:
            y, sr = librosa.load(filepath, duration=10)
            duration = len(y) / sr
            print(f"  ✓ Duração: {duration:.2f}s")
        except Exception as e:
            print(f"  ✗ Erro: {e}")
            duration = 0
        
        print("\nETAPA 6: Salvando resultado no progress_data...")
        # IMPORTANTE: Salvar stems ANTES de atualizar para 100%
        # para evitar race condition com o frontend
        try:
            progress_data[task_id]['stems'] = stems_info
            progress_data[task_id]['processing_time'] = elapsed_time
            progress_data[task_id]['stems_mode'] = stems_mode
            progress_data[task_id]['quality_mode'] = quality_mode
            progress_data[task_id]['model_used'] = model_used
            print(f"  ✓ Dados salvos no progress_data!")
            print(f"  ✓ Stems disponíveis: {len(stems_info)}")
        except Exception as e:
            print(f"  ✗ Erro ao salvar: {e}")
        
        print("\nETAPA 7: Atualizando progresso para 100%...")
        update_progress(task_id, 4, f"Concluído! {len(stems_info)} stems criados", 100)
        print(f"  ✓ Progresso atualizado para 100%!")
        
        print("\nETAPA 8: Adicionando ao histórico...")
        add_to_history(filename, len(stems_info), 0, duration, stems_info, None)
        print(f"  ✓ Histórico atualizado!")
        
        print(f"\n{'='*60}")
        print(f"✓ SEPARAÇÃO CONCLUÍDA COM SUCESSO!")
        print(f"  Tempo: {elapsed_time:.1f}s")
        print(f"  Stems: {len(stems_info)}")
        print(f"  Modo: {stems_mode} stems")
        print(f"  Qualidade: {quality_mode}")
        print(f"  Modelo: {model_used}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"✗ ERRO NA SEPARAÇÃO!")
        print(f"  Erro: {str(e)}")
        print(f"{'='*60}\n")
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
        
        # Obter modo de qualidade (fast, balanced, quality)
        quality_mode = request.form.get('quality_mode', 'balanced')  # Default: balanced
        
        # Validar quality_mode
        if quality_mode not in ['fast', 'balanced', 'quality']:
            quality_mode = 'balanced'
        
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
            args=(task_id, filepath, filename, stems_mode, duration_limit, quality_mode)
        )
        thread.daemon = True
        thread.start()
        
        # Retornar imediatamente com task_id
        return jsonify({
            'status': 'processing',
            'message': 'Separação iniciada em background',
            'task_id': task_id,
            'stems_mode': stems_mode,
            'quality_mode': quality_mode
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

@app.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    """Serve arquivos de upload originais"""
    try:
        from urllib.parse import unquote
        # Decodificar URL encoding (ex: %20 -> espaço)
        decoded_filename = unquote(filename)
        print(f"Filename recebido: {filename}")
        print(f"Filename decodificado: {decoded_filename}")
        
        upload_path = os.path.join(UPLOAD_FOLDER, decoded_filename)
        print(f"Caminho completo: {upload_path}")
        print(f"Arquivo existe: {os.path.exists(upload_path)}")
        
        if os.path.exists(upload_path):
            # Detectar mimetype baseado na extensão
            if decoded_filename.lower().endswith('.mp3'):
                return send_file(upload_path, mimetype='audio/mpeg')
            elif decoded_filename.lower().endswith('.wav'):
                return send_file(upload_path, mimetype='audio/wav')
            elif decoded_filename.lower().endswith('.ogg'):
                return send_file(upload_path, mimetype='audio/ogg')
            elif decoded_filename.lower().endswith('.m4a'):
                return send_file(upload_path, mimetype='audio/mp4')
            else:
                return send_file(upload_path, mimetype='audio/mpeg')
        else:
            print(f"Arquivo não encontrado: {upload_path}")
            # Listar arquivos disponíveis para debug
            if os.path.exists(UPLOAD_FOLDER):
                print(f"Arquivos em {UPLOAD_FOLDER}:")
                for f in os.listdir(UPLOAD_FOLDER):
                    print(f"  - {f}")
            return jsonify({'error': 'Arquivo não encontrado'}), 404
    except Exception as e:
        print(f"Erro ao servir arquivo: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== ANÁLISE DE ACORDES ====================

def convert_chord_notation(harte_chord):
    """
    Converte notação Harte (acadêmica) para notação musical tradicional
    
    Exemplos:
    - "C:maj" -> "C"
    - "A:min" -> "Am"
    - "D:maj7" -> "Dmaj7"
    - "G:min7" -> "Gm7"
    - "F#:maj" -> "F#"
    - "Bb:min" -> "Bbm"
    - "E:5" -> "E5" (power chord)
    - "A:sus4" -> "Asus4"
    - "D:dim" -> "D°" ou "Ddim"
    - "G:aug" -> "G+" ou "Gaug"
    """
    if ':' not in harte_chord:
        return harte_chord
    
    # Separar nota e qualidade
    root, quality = harte_chord.split(':', 1)
    
    # Mapeamento de qualidades
    quality_map = {
        'maj': '',           # C maior = C
        'min': 'm',          # C menor = Cm
        'maj7': 'maj7',      # C maior com sétima maior = Cmaj7
        'min7': 'm7',        # C menor com sétima = Cm7
        '7': '7',            # C dominante = C7
        'dim': '°',          # C diminuto = C°
        'aug': '+',          # C aumentado = C+
        'sus2': 'sus2',      # C suspenso 2 = Csus2
        'sus4': 'sus4',      # C suspenso 4 = Csus4
        '5': '5',            # Power chord = C5
        'maj6': '6',         # C maior com sexta = C6
        'min6': 'm6',        # C menor com sexta = Cm6
        '9': '9',            # C nona = C9
        'maj9': 'maj9',      # C maior com nona = Cmaj9
        'min9': 'm9',        # C menor com nona = Cm9
        '11': '11',          # C décima primeira = C11
        '13': '13',          # C décima terceira = C13
        'dim7': '°7',        # C diminuto com sétima = C°7
        'hdim7': 'ø7',       # C meio-diminuto = Cø7 (ou Cm7b5)
        'minmaj7': 'm(maj7)', # C menor com sétima maior = Cm(maj7)
    }
    
    # Converter qualidade
    converted_quality = quality_map.get(quality, quality)
    
    return f"{root}{converted_quality}"

def detect_chords_with_autochord(audio_path):
    """Detecta acordes usando o melhor método disponível"""
    try:
        # Tentar usar CREMA (melhor precisão)
        return analyze_chords_crema(audio_path), 'crema_deep_learning'
    except ImportError:
        print("⚠️  CREMA não instalado, usando método chroma básico")
        print("   Para melhor precisão, instale: pip install crema")
        return analyze_chords_chroma_enhanced(audio_path), 'chroma_enhanced'
    except Exception as e:
        print(f"Erro com CREMA: {e}, usando método chroma")
        return analyze_chords_chroma_enhanced(audio_path), 'chroma_enhanced'

def analyze_chords_crema(audio_path):
    """Detecção de acordes usando CREMA (Deep Learning) - MELHOR PRECISÃO"""
    import crema
    import numpy as np
    
    print("🎵 Usando CREMA (Deep Learning) para detecção de acordes...")
    
    # Criar modelo CREMA
    model = crema.models.chord.ChordModel()
    
    # Usar CREMA para detectar acordes (passa o caminho do arquivo)
    chord_annotation = model.predict(filename=audio_path)
    
    # Processar resultados - CREMA retorna um objeto JAMS Annotation
    chords = []
    prev_chord = None
    
    # Iterar sobre os dados da anotação
    for observation in chord_annotation.data:
        chord_label = observation.value
        
        # Pular acordes "N" (sem acorde/silêncio) e "X" (desconhecido)
        if chord_label == 'N' or chord_label == 'X':
            continue
        
        start_time = float(observation.time)
        end_time = float(observation.time + observation.duration)
        
        # Converter de notação Harte (C:maj) para notação tradicional (C)
        chord_name = convert_chord_notation(chord_label)
        
        # Evitar duplicatas consecutivas
        if chord_name != prev_chord:
            chords.append({
                'start': start_time,
                'end': end_time,
                'chord': chord_name
            })
            prev_chord = chord_name
        else:
            # Estender o acorde anterior
            if chords:
                chords[-1]['end'] = end_time
    
    print(f"✓ CREMA detectou {len(chords)} acordes")
    return chords

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
            
            # Criar notação Harte e converter para tradicional
            harte_notation = f'{root_note}:{chord_quality}'
            chord_name = convert_chord_notation(harte_notation)
            
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
