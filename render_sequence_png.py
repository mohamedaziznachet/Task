import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Diagramme de Séquence - TaskFlow</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    background: #0f172a;
    color: #f8fafc;
    padding: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  
  .canvas-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 35px 45px;
    width: 1450px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #334155;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .title-group h1 {
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge {
    background: linear-gradient(135deg, #0284c7, #10b981);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
  }
  .title-group p {
    color: #94a3b8;
    font-size: 13px;
    margin-top: 5px;
  }

  /* Sequence Canvas */
  .seq-container {
    position: relative;
    padding: 20px 10px;
  }

  /* Lifeline Headers */
  .lifelines-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 30px;
    text-align: center;
    position: relative;
  }
  .lifeline-box {
    background: #0f172a;
    border: 2px solid;
    border-radius: 12px;
    padding: 12px;
    font-weight: 700;
    font-size: 13px;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .p1 { border-color: #38bdf8; color: #38bdf8; }
  .p2 { border-color: #4ade80; color: #4ade80; }
  .p3 { border-color: #c084fc; color: #c084fc; }
  .p4 { border-color: #fbbf24; color: #fbbf24; }
  .p5 { border-color: #f87171; color: #f87171; }

  /* Vertical dashed lines */
  .vertical-lines {
    position: absolute;
    top: 60px;
    bottom: 20px;
    left: 0;
    right: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 30px;
    pointer-events: none;
    z-index: 1;
  }
  .vline {
    position: relative;
    margin: 0 auto;
    width: 2px;
    height: 100%;
    background: repeating-linear-gradient(180deg, #475569, #475569 6px, transparent 6px, transparent 12px);
  }

  /* Messages Timeline */
  .messages-flow {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    position: relative;
    z-index: 3;
  }

  .msg-row {
    display: flex;
    align-items: center;
    position: relative;
    height: 38px;
  }

  .arrow-line {
    position: absolute;
    height: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .arrow-line.solid {
    background: #e2e8f0;
  }
  .arrow-line.dashed {
    background: repeating-linear-gradient(90deg, #94a3b8, #94a3b8 6px, transparent 6px, transparent 12px);
  }
  .arrow-line.async {
    background: #c084fc;
  }

  .arrow-line::after {
    content: '';
    position: absolute;
    right: 0;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
  }
  .arrow-line.solid::after { border-left: 8px solid #e2e8f0; }
  .arrow-line.dashed::after { border-left: 8px solid #94a3b8; }
  .arrow-line.async::after { border-left: 8px solid #c084fc; }

  .arrow-line.to-left::after {
    right: auto;
    left: 0;
    border-left: none;
  }
  .arrow-line.to-left.solid::after { border-right: 8px solid #e2e8f0; }
  .arrow-line.to-left.dashed::after { border-right: 8px solid #94a3b8; }

  .msg-text {
    background: #1e293b;
    border: 1px solid #334155;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .num {
    color: #38bdf8;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    margin-right: 4px;
  }

  /* Self message */
  .self-loop {
    position: absolute;
    left: 50%;
    width: 90px;
    height: 30px;
    border: 2px solid #c084fc;
    border-left: none;
    border-radius: 0 8px 8px 0;
    margin-left: 0px;
  }
  .self-loop::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 8px solid #c084fc;
  }

  /* Positioning across 5 cols: 
     col1 = 10%, col2 = 30%, col3 = 50%, col4 = 70%, col5 = 90%
  */
  .from-1-to-2 { left: 10%; width: 20%; }
  .from-2-to-3 { left: 30%; width: 20%; }
  .from-3-to-4 { left: 50%; width: 20%; }
  .from-4-to-3 { left: 50%; width: 20%; }
  .from-3-to-5 { left: 50%; width: 40%; }
  .from-5-to-2 { left: 30%; width: 60%; }
  .from-3-to-2 { left: 30%; width: 20%; }
  .from-2-to-1 { left: 10%; width: 20%; }

  .footer-note {
    margin-top: 30px;
    border-top: 1px solid #334155;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>
<body>

<div class="canvas-card">
  <!-- Header -->
  <div class="header">
    <div class="title-group">
      <h1>
        <span>Diagramme de Séquence Système : Cycle de Vie & Recalcul d'une Tâche</span>
        <span class="badge">UML 2.5 • Scénario Nominal</span>
      </h1>
      <p>Modélisation de l'interaction synchrone/asynchrone : Déplacement Kanban &rarr; Persistance &rarr; Recalcul automatique (RG-08) &rarr; Notification WebSocket</p>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b; font-family: 'JetBrains Mono', monospace;">
      <div>Plateforme : <strong>TaskFlow (3 GLSI)</strong></div>
      <div>Règle Métier : <strong>RG-08 (Recalcul Avancement)</strong></div>
    </div>
  </div>

  <!-- Sequence Body -->
  <div class="seq-container">
    
    <!-- Lifelines -->
    <div class="lifelines-row">
      <div class="lifeline-box p1">👤 Collaborateur<br><span style="font-size:10px; font-weight:normal; color:#94a3b8;">(Acteur Métier)</span></div>
      <div class="lifeline-box p2">🖥️ Interface React<br><span style="font-size:10px; font-weight:normal; color:#94a3b8;">(Navigateur Web)</span></div>
      <div class="lifeline-box p3">⚙️ Serveur Express<br><span style="font-size:10px; font-weight:normal; color:#94a3b8;">(API REST Backend)</span></div>
      <div class="lifeline-box p4">💾 Base MongoDB<br><span style="font-size:10px; font-weight:normal; color:#94a3b8;">(Collection Tasks/Projects)</span></div>
      <div class="lifeline-box p5">⚡ Service Socket.io<br><span style="font-size:10px; font-weight:normal; color:#94a3b8;">(Moteur WebSocket)</span></div>
    </div>

    <div class="vertical-lines">
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
      <div class="vline"></div>
    </div>

    <!-- Messages -->
    <div class="messages-flow">
      
      <!-- 1 -->
      <div class="msg-row">
        <div class="arrow-line solid from-1-to-2">
          <span class="msg-text"><span class="num">1</span> Déplacer tâche vers "Terminée" (Drag & Drop)</span>
        </div>
      </div>

      <!-- 2 -->
      <div class="msg-row">
        <div class="arrow-line solid from-2-to-3">
          <span class="msg-text"><span class="num">2</span> PATCH /api/tasks/:id { statut: "Terminée" } (Token JWT)</span>
        </div>
      </div>

      <!-- 3: Self loop -->
      <div class="msg-row" style="margin-left: 50%;">
        <div class="self-loop"></div>
        <span class="msg-text" style="margin-left: 95px;"><span class="num">3</span> Vérifier JWT & Droits RBAC</span>
      </div>

      <!-- 4 -->
      <div class="msg-row">
        <div class="arrow-line solid from-3-to-4">
          <span class="msg-text"><span class="num">4</span> updateOne({ _id }, { status: "Terminée" })</span>
        </div>
      </div>

      <!-- 5 -->
      <div class="msg-row">
        <div class="arrow-line dashed to-left from-4-to-3">
          <span class="msg-text"><span class="num">5</span> Confirmation persistance tâche</span>
        </div>
      </div>

      <!-- 6 -->
      <div class="msg-row">
        <div class="arrow-line solid from-3-to-4">
          <span class="msg-text"><span class="num">6</span> Recalcul avancement projet parent : (Tâches finies / Total) * 100</span>
        </div>
      </div>

      <!-- 7 -->
      <div class="msg-row">
        <div class="arrow-line dashed to-left from-4-to-3">
          <span class="msg-text"><span class="num">7</span> Nouveau pourcentage projet sauvegardé</span>
        </div>
      </div>

      <!-- 8 -->
      <div class="msg-row">
        <div class="arrow-line async from-3-to-5">
          <span class="msg-text" style="color: #c084fc;"><span class="num">8</span> Diffuser notification instantanée ("task:updated")</span>
        </div>
      </div>

      <!-- 9 -->
      <div class="msg-row">
        <div class="arrow-line dashed to-left from-3-to-2">
          <span class="msg-text"><span class="num">9</span> 200 OK { tâche, projet: { avancement: 85% } }</span>
        </div>
      </div>

      <!-- 10 -->
      <div class="msg-row">
        <div class="arrow-line async to-left from-5-to-2">
          <span class="msg-text" style="color: #c084fc;"><span class="num">10</span> Synchroniser en direct les écrans des autres membres (Socket.io)</span>
        </div>
      </div>

      <!-- 11 -->
      <div class="msg-row">
        <div class="arrow-line dashed to-left from-2-to-1">
          <span class="msg-text"><span class="num">11</span> Notification succès & Jauges Dashboard actualisées</span>
        </div>
      </div>

    </div>

  </div>

  <div class="footer-note">
    <div>TaskFlow Web Platform • Modélisation UML • Licence 3 GLSI - ISSAT Kasserine</div>
    <div>Norme UML 2.5 • Interactions Synchrones (—▶) / Retours Réponse (- - ▷) / Asynchrones Temps Réel (—▷)</div>
  </div>
</div>

</body>
</html>
"""

html_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_sequence.html"
png_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_sequence.png"
brain_png = r"C:\Users\DELL\.gemini\antigravity\brain\d6f9eae9-0713-4348-9ed1-9b2c3b287e30\diagramme_sequence.png"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML sequence written to {html_path}")

brave_exe = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
cmd = [
    brave_exe,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1550,950",
    f"--screenshot={png_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(png_path):
    print("PNG Sequence diagram generated! Size:", os.path.getsize(png_path), "bytes")
    import shutil
    shutil.copyfile(png_path, brain_png)
    print("Copied to brain artifacts:", brain_png)
else:
    print("Error: PNG not found.")
