import os
import subprocess
import json

html_content = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Diagramme des Cas d'Utilisation Global - TaskFlow</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    padding: 40px;
    width: 1750px;
    position: relative;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #334155;
    padding-bottom: 24px;
    margin-bottom: 30px;
  }
  .title-group h1 {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 12px;
    letter-spacing: -0.5px;
  }
  .title-group h1 span.badge {
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    color: white;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .title-group p {
    color: #94a3b8;
    font-size: 14px;
    margin-top: 6px;
  }
  .meta-tag {
    text-align: right;
    font-size: 12px;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
  }
  .meta-tag strong {
    color: #38bdf8;
  }

  /* Grid Layout for Use Cases */
  .diagram-container {
    display: grid;
    grid-template-columns: 280px 1fr 280px;
    gap: 30px;
    position: relative;
  }

  /* Actors Column */
  .actors-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .actor-card {
    background: #0f172a;
    border: 1.5px solid #334155;
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    position: relative;
    transition: all 0.2s ease;
  }
  .actor-card.visitor { border-color: #64748b; }
  .actor-card.employe { border-color: #38bdf8; }
  .actor-card.chef { border-color: #a855f7; }
  .actor-card.admin { border-color: #ef4444; }
  .actor-card.system { border-color: #10b981; }

  .actor-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }
  .actor-card.visitor .actor-icon { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
  .actor-card.employe .actor-icon { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
  .actor-card.chef .actor-icon { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
  .actor-card.admin .actor-icon { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .actor-card.system .actor-icon { background: rgba(16, 185, 129, 0.15); color: #34d399; }

  .actor-info h3 {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .actor-info p {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 3px;
    line-height: 1.3;
  }
  .actor-inherit {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255,255,255,0.08);
    color: #cbd5e1;
    margin-top: 5px;
  }

  .actor-divider-arrow {
    text-align: center;
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
    margin: -14px 0 -14px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .actor-divider-arrow span {
    background: #1e293b;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px dashed #475569;
  }

  /* System Boundary (Subject) */
  .system-boundary {
    background: rgba(15, 23, 42, 0.6);
    border: 2px dashed #475569;
    border-radius: 16px;
    padding: 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .system-label {
    position: absolute;
    top: -14px;
    left: 28px;
    background: #0f172a;
    border: 1.5px solid #475569;
    padding: 3px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Modules / Packages Grid inside boundary */
  .packages-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .pkg-box {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 16px;
    position: relative;
  }
  .pkg-box.full-width {
    grid-column: 1 / -1;
  }
  .pkg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #334155;
  }
  .pkg-header h4 {
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pkg-header span.tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: #0f172a;
    color: #94a3b8;
  }

  .usecases-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .uc-pill {
    background: #0f172a;
    border: 1.5px solid #475569;
    border-radius: 20px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
  }
  .uc-pill .uc-text {
    font-size: 12px;
    font-weight: 600;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .uc-pill .uc-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 2px 6px;
    border-radius: 6px;
  }
  .uc-relations {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .badge-inc {
    font-size: 9px;
    font-weight: 700;
    color: #fb923c;
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.3);
    padding: 1px 6px;
    border-radius: 10px;
  }
  .badge-ext {
    font-size: 9px;
    font-weight: 700;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.15);
    border: 1px solid rgba(167, 139, 250, 0.3);
    padding: 1px 6px;
    border-radius: 10px;
  }

  /* Right Column (Secondary Actor & Global Legend) */
  .right-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .legend-box {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 18px;
  }
  .legend-box h3 {
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .legend-line {
    width: 32px;
    height: 2px;
    flex-shrink: 0;
  }
  .legend-line.solid { background: #38bdf8; }
  .legend-line.dashed-inc {
    background: repeating-linear-gradient(90deg, #fb923c, #fb923c 4px, transparent 4px, transparent 8px);
  }
  .legend-line.dashed-ext {
    background: repeating-linear-gradient(90deg, #a78bfa, #a78bfa 4px, transparent 4px, transparent 8px);
  }
  .legend-line.inherit {
    position: relative;
    background: #cbd5e1;
  }
  .legend-line.inherit::after {
    content: '';
    position: absolute;
    right: -4px;
    top: -4px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 7px solid #cbd5e1;
  }

  .rules-summary {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 16px;
    font-size: 11px;
    color: #cbd5e1;
  }
  .rules-summary h4 {
    font-size: 12px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 8px;
  }
  .rules-summary ul {
    list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rules-summary li strong {
    color: #f59e0b;
    font-family: 'JetBrains Mono', monospace;
  }

  .footer-note {
    margin-top: 24px;
    border-top: 1px solid #334155;
    padding-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>
<body>

<div class="canvas-card">
  <!-- HEADER -->
  <div class="header">
    <div class="title-group">
      <h1>
        <span>Diagramme Général des Cas d'Utilisation</span>
        <span class="badge">UML 2.5 • Vue Globale</span>
      </h1>
      <p>Modélisation formelle du périmètre fonctionnel complet de la plateforme web <strong>TaskFlow</strong> (Projet 3 GLSI - ISSAT Kasserine)</p>
    </div>
    <div class="meta-tag">
      <div>Standard : <strong>UML 2.5 ISO/IEC 19505</strong></div>
      <div>Architecture : <strong>MERN 3-Tiers</strong></div>
      <div>Date : <strong>Novembre 2026</strong></div>
    </div>
  </div>

  <!-- DIAGRAM CONTAINER -->
  <div class="diagram-container">
    
    <!-- LEFT COLUMN: HUMAN ACTORS HIERARCHY -->
    <div class="actors-column">
      
      <!-- Visiteur -->
      <div class="actor-card visitor">
        <div class="actor-icon">👤</div>
        <div class="actor-info">
          <h3>Visiteur</h3>
          <p>Utilisateur non connecté navigant sur la page d'accueil et d'authentification.</p>
        </div>
      </div>

      <!-- Employé -->
      <div class="actor-card employe">
        <div class="actor-icon">💼</div>
        <div class="actor-info">
          <h3>Employé</h3>
          <p>Membre opérationnel de l'équipe exécutant ses tâches et consultant ses indicateurs.</p>
          <span class="actor-inherit">Acteur Métier de Base</span>
        </div>
      </div>

      <div class="actor-divider-arrow">
        <span>▲ hérite de (généralisation)</span>
      </div>

      <!-- Chef de Projet -->
      <div class="actor-card chef">
        <div class="actor-icon">👔</div>
        <div class="actor-info">
          <h3>Chef de projet</h3>
          <p>Gestionnaire des projets, de l'assignation des tâches et du suivi d'avancement.</p>
          <span class="actor-inherit">Hérite de : Employé</span>
        </div>
      </div>

      <div class="actor-divider-arrow">
        <span>▲ hérite de (généralisation)</span>
      </div>

      <!-- Administrateur -->
      <div class="actor-card admin">
        <div class="actor-icon">🛡️</div>
        <div class="actor-info">
          <h3>Administrateur</h3>
          <p>Superviseur système : gestion des comptes, rôles, audits et supervision globale.</p>
          <span class="actor-inherit">Hérite de : Chef de projet</span>
        </div>
      </div>

    </div>

    <!-- CENTER COLUMN: SYSTEM BOUNDARY -->
    <div class="system-boundary">
      <div class="system-label">Système : Plateforme Web TaskFlow</div>

      <div class="packages-grid">

        <!-- PKG 1: Authentification & Compte -->
        <div class="pkg-box">
          <div class="pkg-header">
            <h4>🔐 Module 1 : Authentification & Sécurité</h4>
            <span class="tag">4 Cas</span>
          </div>
          <div class="usecases-list">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-01</span> S'inscrire (rôle Employé par défaut)</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-02</span> S'authentifier (JWT + Bcrypt)</span>
              <div class="uc-relations">
                <span class="badge-ext">&laquo;extend&raquo; 3D Guard</span>
              </div>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-03</span> Gérer son profil & mot de passe</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; Auth</span>
              </div>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-04</span> Se déconnecter (Révocation Token)</span>
            </div>
          </div>
        </div>

        <!-- PKG 2: Administration Utilisateurs -->
        <div class="pkg-box">
          <div class="pkg-header">
            <h4>👥 Module 2 : Administration des Utilisateurs</h4>
            <span class="tag">Admin Only</span>
          </div>
          <div class="usecases-list">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-05</span> Consulter l'annuaire des collaborateurs</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-06</span> Promouvoir / Rétrograder rôles (RBAC)</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-07</span> Supprimer un compte utilisateur</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; RG-15/16</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PKG 3: Gestion des Projets -->
        <div class="pkg-box">
          <div class="pkg-header">
            <h4>📁 Module 3 : Gestion des Projets</h4>
            <span class="tag">Chef / Admin</span>
          </div>
          <div class="usecases-list">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-08</span> Consulter la liste des projets</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-09</span> Créer un projet</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; RG-01 (Dates)</span>
              </div>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-10</span> Modifier les paramètres du projet</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-11</span> Supprimer un projet</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; RG-02 (Garde-fou)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PKG 4: Gestion des Tâches -->
        <div class="pkg-box">
          <div class="pkg-header">
            <h4>📋 Module 4 : Gestion des Tâches & Affectations</h4>
            <span class="tag">Cœur Métier</span>
          </div>
          <div class="usecases-list">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-12</span> Créer une tâche & assigner à 1 employé</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; RG-07</span>
                <span class="badge-ext">&laquo;ext&raquo; Fichiers</span>
              </div>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-13</span> Mettre à jour l'état de ses tâches</span>
              <div class="uc-relations">
                <span class="badge-inc">&laquo;include&raquo; RG-08 (Calcul %)</span>
                <span class="badge-ext">&laquo;ext&raquo; Notif WS</span>
              </div>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-14</span> Gérer la checklist de sous-tâches</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-15</span> Téléverser / Télécharger pièces jointes</span>
            </div>
          </div>
        </div>

        <!-- PKG 5: Vues & Planification (Full width) -->
        <div class="pkg-box full-width">
          <div class="pkg-header">
            <h4>📊 Module 5 : Vues Multidimensionnelles & Planification</h4>
            <span class="tag">Tous Rôles</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-16</span> Vue Liste tabulaire</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-17</span> Kanban Drag & Drop</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-18</span> Vue Calendrier</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-19</span> Chronogramme Gantt</span>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
            <span class="badge-ext" style="font-size: 11px; padding: 4px 10px;">&laquo;extend&raquo; Filtrage & Recherche instantanée (par statut, priorité, date, assigné)</span>
          </div>
        </div>

        <!-- PKG 6: Dashboard & Audit (Full width) -->
        <div class="pkg-box full-width">
          <div class="pkg-header">
            <h4>📈 Module 6 : Tableau de Bord, Reporting & Traçabilité</h4>
            <span class="tag">Analytique & Audit</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-20</span> Consulter Dashboard (7 KPIs & Jauges)</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-21</span> Exporter les rapports en CSV</span>
            </div>
            <div class="uc-pill">
              <span class="uc-text"><span class="uc-id">UC-22</span> Consulter Journal d'Audit temps réel</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- RIGHT COLUMN: SECONDARY ACTORS & LEGEND -->
    <div class="right-column">
      
      <!-- Acteur Secondaire : Socket.io -->
      <div class="actor-card system">
        <div class="actor-icon">⚡</div>
        <div class="actor-info">
          <h3>Service Temps Réel</h3>
          <p>Moteur WebSocket (Socket.io) assurant la diffusion instantanée des notifications d'événements.</p>
          <span class="actor-inherit">Acteur Système Secondaire</span>
        </div>
      </div>

      <!-- Service Stockage Fichiers -->
      <div class="actor-card system" style="border-color: #f59e0b;">
        <div class="actor-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">📁</div>
        <div class="actor-info">
          <h3>Service Fichiers</h3>
          <p>Moteur Multer & Stockage local pour l'upload des pièces jointes de tâches.</p>
          <span class="actor-inherit">Acteur Système Secondaire</span>
        </div>
      </div>

      <!-- Légende Formelle UML -->
      <div class="legend-box">
        <h3>📐 Légende des Relations UML</h3>
        <div class="legend-item">
          <div class="legend-line solid"></div>
          <div><strong>Association :</strong> Interaction directe acteur-système</div>
        </div>
        <div class="legend-item">
          <div class="legend-line inherit"></div>
          <div><strong>Généralisation :</strong> Héritage hiérarchique des droits</div>
        </div>
        <div class="legend-item">
          <div class="legend-line dashed-inc"></div>
          <div><strong>&laquo;include&raquo; :</strong> Exécution obligatoire préalable</div>
        </div>
        <div class="legend-item">
          <div class="legend-line dashed-ext"></div>
          <div><strong>&laquo;extend&raquo; :</strong> Comportement optionnel / conditionnel</div>
        </div>
      </div>

      <!-- Règles Métier Clés -->
      <div class="rules-summary">
        <h4>⚖️ Règles Métier Clés (Rapport)</h4>
        <ul>
          <li><strong>RG-01 :</strong> Cohérence date début < date fin projet.</li>
          <li><strong>RG-02 :</strong> Interdiction suppression projet si tâches actives.</li>
          <li><strong>RG-06 :</strong> 1 seul employé affecté par tâche.</li>
          <li><strong>RG-07 :</strong> Dates tâche incluses dans celles du projet.</li>
          <li><strong>RG-08 :</strong> Recalcul automatique avancement projet.</li>
          <li><strong>RG-15 :</strong> Interdiction suppression employé avec tâches.</li>
          <li><strong>RG-16 :</strong> Interdiction suppression chef avec projets.</li>
        </ul>
      </div>

    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    <div>Plateforme TaskFlow • Institut Supérieur des Sciences Appliquées et de Technologie de Kasserine</div>
    <div>Département d'Informatique • Licence 3 GLSI • Module Génie Logiciel & UML</div>
  </div>
</div>

</body>
</html>
"""

html_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_cas_utilisation.html"
png_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_cas_utilisation.png"
brain_png = r"C:\Users\DELL\.gemini\antigravity\brain\d6f9eae9-0713-4348-9ed1-9b2c3b287e30\diagramme_cas_utilisation.png"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML written to {html_path}")

# Run Brave headless to take a high-res screenshot
brave_exe = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
cmd = [
    brave_exe,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1850,1350",
    f"--screenshot={png_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Rendering PNG screenshot via Brave headless...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Exit code:", res.returncode)
if os.path.exists(png_path):
    print("PNG generated successfully! Size:", os.path.getsize(png_path), "bytes")
    # Copy to brain artifacts
    import shutil
    shutil.copyfile(png_path, brain_png)
    print("Copied to brain artifacts:", brain_png)
else:
    print("Error: PNG not found.")
