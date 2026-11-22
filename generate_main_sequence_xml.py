import os
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

def create_diagram_xml():
    mxfile = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": "2026-11-04T23:15:00.000Z",
        "agent": "Antigravity UML Agent",
        "version": "24.0.0",
        "type": "device"
    })

    # =========================================================================
    # DIAGRAM 1: SCÉNARIO GLOBAL (Les 3 actions principales du site)
    # =========================================================================
    diag1 = ET.SubElement(mxfile, "diagram", {"id": "diag_global", "name": "1. Scénario Principal Global"})
    model1 = ET.SubElement(diag1, "mxGraphModel", {
        "dx": "1400", "dy": "900", "grid": "1", "gridSize": "10",
        "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1",
        "page": "1", "pageWidth": "1300", "pageHeight": "950"
    })
    root1 = ET.SubElement(model1, "root")
    ET.SubElement(root1, "mxCell", {"id": "0"})
    ET.SubElement(root1, "mxCell", {"id": "1", "parent": "0"})

    cid = 2
    def cell1(val, style, parent="1", vertex=True, edge=False, x=0, y=0, w=0, h=0, src=None, tgt=None):
        nonlocal cid
        i = str(cid)
        cid += 1
        attrs = {"id": i, "value": val, "style": style, "parent": parent}
        if vertex: attrs["vertex"] = "1"
        if edge: attrs["edge"] = "1"
        if src: attrs["source"] = src
        if tgt: attrs["target"] = tgt
        c = ET.SubElement(root1, "mxCell", attrs)
        if vertex:
            ET.SubElement(c, "mxGeometry", {"x": str(x), "y": str(y), "width": str(w), "height": str(h), "as": "geometry"})
        elif edge:
            ET.SubElement(c, "mxGeometry", {"relative": "1", "as": "geometry"})
        return i

    # Titre
    cell1("Diagramme de Séquence Global : Les Opérations Principales de TaskFlow", 
          "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=15;fontStyle=1;fontColor=#0f172a;",
          x=150, y=20, w=900, h=30)

    # Lignes de vie
    ll_user = cell1("👤 Utilisateur\n(Employé / Chef)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#e0f2fe;strokeColor=#0284c7;strokeWidth=2;fontStyle=1;fontColor=#0369a1;fontSize=12;size=50;", x=60, y=70, w=130, h=780)
    ll_react = cell1("🖥️ Interface React\n(Frontend)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#f0fdf4;strokeColor=#16a34a;strokeWidth=2;fontStyle=1;fontColor=#15803d;fontSize=12;size=50;", x=310, y=70, w=130, h=780)
    ll_api = cell1("⚙️ API Express\n(Backend REST)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#faf5ff;strokeColor=#9333ea;strokeWidth=2;fontStyle=1;fontColor=#6b21a8;fontSize=12;size=50;", x=560, y=70, w=130, h=780)
    ll_db = cell1("💾 Base MongoDB\n(Persistance)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#fffbeb;strokeColor=#f59e0b;strokeWidth=2;fontStyle=1;fontColor=#92400e;fontSize=12;size=50;", x=810, y=70, w=130, h=780)
    ll_ws = cell1("⚡ Socket.io\n(Temps Réel)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#fef2f2;strokeColor=#ef4444;strokeWidth=2;fontStyle=1;fontColor=#991b1b;fontSize=12;size=50;", x=1050, y=70, w=120, h=780)

    # Group boxes (Cadres de phases)
    box_style = "shape=umlFrame;whiteSpace=wrap;html=1;width=180;height=24;fillColor=#f8fafc;strokeColor=#64748b;strokeWidth=1.5;dashed=1;fontSize=11;fontStyle=1;fontColor=#334155;"
    cell1("Phase 1 : Authentification Sécurisée", box_style, x=40, y=140, w=1150, h=190)
    cell1("Phase 2 : Création & Affectation de Tâche", box_style, x=40, y=350, w=1150, h=220)
    cell1("Phase 3 : Traitement & Recalcul Avancement", box_style, x=40, y=590, w=1150, h=230)

    # Styles messages
    s_sync = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeWidth=1.8;strokeColor=#1e293b;fontSize=11;fontStyle=1;fontColor=#0f172a;"
    s_ret = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;dashed=1;endArrow=open;strokeWidth=1.5;strokeColor=#64748b;fontSize=11;fontColor=#475569;"
    s_async = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=open;strokeWidth=1.8;strokeColor=#7c3aed;fontSize=11;fontStyle=1;fontColor=#6d28d9;"
    s_self = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeWidth=1.5;strokeColor=#9333ea;fontSize=11;fontStyle=1;fontColor=#6b21a8;"

    # Phase 1 Messages
    cell1("1: Saisir email et mot de passe", s_sync, edge=True, src=ll_user, tgt=ll_react)
    cell1("2: POST /api/auth/login { email, motDePasse }", s_sync, edge=True, src=ll_react, tgt=ll_api)
    cell1("3: Vérifier identifiants (Bcrypt)", s_sync, edge=True, src=ll_api, tgt=ll_db)
    cell1("4: Utilisateur authentifié & Génération Token JWT", s_ret, edge=True, src=ll_db, tgt=ll_api)
    cell1("5: 200 OK { tokenJWT, profil }", s_ret, edge=True, src=ll_api, tgt=ll_react)
    cell1("6: Redirection vers le Tableau de bord", s_ret, edge=True, src=ll_react, tgt=ll_user)

    # Phase 2 Messages
    cell1("7: Créer une tâche & Assigner à 1 employé (RG-06)", s_sync, edge=True, src=ll_user, tgt=ll_react)
    cell1("8: POST /api/tasks (avec Token JWT)", s_sync, edge=True, src=ll_react, tgt=ll_api)
    cell1("9: Contrôle dates dans le projet (RG-07) & Persistance", s_sync, edge=True, src=ll_api, tgt=ll_db)
    cell1("10: Tâche créée avec statut 'Non commencée'", s_ret, edge=True, src=ll_db, tgt=ll_api)
    cell1("11: Notification en direct (Nouvelle tâche)", s_async, edge=True, src=ll_api, tgt=ll_ws)
    cell1("12: 201 Created (Tâche enregistrée)", s_ret, edge=True, src=ll_api, tgt=ll_react)

    # Phase 3 Messages
    cell1("13: Déplacer tâche vers 'Terminée' (Kanban)", s_sync, edge=True, src=ll_user, tgt=ll_react)
    cell1("14: PATCH /api/tasks/:id { statut: 'Terminée' }", s_sync, edge=True, src=ll_react, tgt=ll_api)
    cell1("15: Recalculer automatiquement avancement projet (RG-08)", s_sync, edge=True, src=ll_api, tgt=ll_db)
    cell1("16: Tâche et avancement projet mis à jour", s_ret, edge=True, src=ll_db, tgt=ll_api)
    cell1("17: Broadcast événement WebSocket à l'équipe", s_async, edge=True, src=ll_api, tgt=ll_ws)
    cell1("18: 200 OK (Données actualisées)", s_ret, edge=True, src=ll_api, tgt=ll_react)
    cell1("19: Mise à jour temps réel des jauges et KPIs", s_ret, edge=True, src=ll_react, tgt=ll_user)

    # =========================================================================
    # DIAGRAM 2: AUTHENTIFICATION SÉCURISÉE (Simple & Détaillé)
    # =========================================================================
    diag2 = ET.SubElement(mxfile, "diagram", {"id": "diag_auth", "name": "2. Authentification Sécurisée"})
    model2 = ET.SubElement(diag2, "mxGraphModel", {
        "dx": "1200", "dy": "800", "grid": "1", "gridSize": "10",
        "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1",
        "page": "1", "pageWidth": "1100", "pageHeight": "700"
    })
    root2 = ET.SubElement(model2, "root")
    ET.SubElement(root2, "mxCell", {"id": "0"})
    ET.SubElement(root2, "mxCell", {"id": "1", "parent": "0"})

    cid2 = 2
    def cell2(val, style, parent="1", vertex=True, edge=False, x=0, y=0, w=0, h=0, src=None, tgt=None):
        nonlocal cid2
        i = str(cid2)
        cid2 += 1
        attrs = {"id": i, "value": val, "style": style, "parent": parent}
        if vertex: attrs["vertex"] = "1"
        if edge: attrs["edge"] = "1"
        if src: attrs["source"] = src
        if tgt: attrs["target"] = tgt
        c = ET.SubElement(root2, "mxCell", attrs)
        if vertex:
            ET.SubElement(c, "mxGeometry", {"x": str(x), "y": str(y), "width": str(w), "height": str(h), "as": "geometry"})
        elif edge:
            ET.SubElement(c, "mxGeometry", {"relative": "1", "as": "geometry"})
        return i

    cell2("Diagramme de Séquence : Authentification &amp; Session Sécurisée (JWT)", 
          "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=15;fontStyle=1;fontColor=#0f172a;",
          x=100, y=20, w=800, h=30)

    u2 = cell2("👤 Utilisateur\n(Tous rôles)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#e0f2fe;strokeColor=#0284c7;strokeWidth=2;fontStyle=1;fontColor=#0369a1;fontSize=12;size=50;", x=60, y=70, w=120, h=520)
    f2 = cell2("🖥️ Interface React\n(Page Login)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#f0fdf4;strokeColor=#16a34a;strokeWidth=2;fontStyle=1;fontColor=#15803d;fontSize=12;size=50;", x=300, y=70, w=130, h=520)
    a2 = cell2("⚙️ API Express\n(Auth Controller)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#faf5ff;strokeColor=#9333ea;strokeWidth=2;fontStyle=1;fontColor=#6b21a8;fontSize=12;size=50;", x=550, y=70, w=130, h=520)
    d2 = cell2("💾 Base MongoDB\n(Collection Users)", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fillColor=#fffbeb;strokeColor=#f59e0b;strokeWidth=2;fontStyle=1;fontColor=#92400e;fontSize=12;size=50;", x=800, y=70, w=130, h=520)

    cell2("1: Saisit email et mot de passe", s_sync, edge=True, src=u2, tgt=f2)
    cell2("2: POST /api/auth/login { email, password }", s_sync, edge=True, src=f2, tgt=a2)
    cell2("3: findOne({ email })", s_sync, edge=True, src=a2, tgt=d2)
    cell2("4: Retourne utilisateur &amp; hash Bcrypt", s_ret, edge=True, src=d2, tgt=a2)
    cell2("5: bcrypt.compare() &amp; Générer JWT", s_self, edge=True, src=a2, tgt=a2)
    cell2("6: 200 OK { token, role, nom }", s_ret, edge=True, src=a2, tgt=f2)
    cell2("7: Stockage Token (LocalStorage) &amp; Redirection Dashboard", s_ret, edge=True, src=f2, tgt=u2)

    return ET.tostring(mxfile, encoding="utf-8", xml_declaration=True).decode("utf-8")

raw_xml = create_diagram_xml()
dom = minidom.parseString(raw_xml)
pretty_xml = dom.toprettyxml(indent="  ")
cleaned_xml = "\n".join([line for line in pretty_xml.split("\n") if line.strip()])

xml_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_sequence_principal.drawio"
with open(xml_path, "w", encoding="utf-8") as f:
    f.write(cleaned_xml)

print(f"Generated multi-tab sequence diagram XML: {xml_path}")
print("Size:", len(cleaned_xml), "bytes")
