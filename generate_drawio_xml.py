import os
import xml.etree.ElementTree as ET

def generate_drawio():
    mxfile = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": "2026-11-04T22:50:00.000Z",
        "agent": "Antigravity UML Agent",
        "version": "24.0.0",
        "type": "device"
    })
    
    diagram = ET.SubElement(mxfile, "diagram", {
        "id": "use_case_taskflow",
        "name": "Diagramme Cas Utilisation TaskFlow"
    })
    
    graphModel = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1600",
        "dy": "1100",
        "grid": "1",
        "gridSize": "10",
        "guides": "1",
        "tooltips": "1",
        "connect": "1",
        "arrows": "1",
        "fold": "1",
        "page": "1",
        "pageScale": "1",
        "pageWidth": "1650",
        "pageHeight": "1150",
        "math": "0",
        "shadow": "0"
    })
    
    root = ET.SubElement(graphModel, "root")
    
    # Layer 0 & 1
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})
    
    # Helper to add cells
    cell_id = 2
    def add_cell(value, style, parent="1", vertex=True, edge=False, x=0, y=0, w=0, h=0, source=None, target=None):
        nonlocal cell_id
        cid = str(cell_id)
        cell_id += 1
        attrs = {"id": cid, "value": value, "style": style, "parent": parent}
        if vertex:
            attrs["vertex"] = "1"
        if edge:
            attrs["edge"] = "1"
        if source:
            attrs["source"] = source
        if target:
            attrs["target"] = target
            
        cell = ET.SubElement(root, "mxCell", attrs)
        if vertex:
            geo = ET.SubElement(cell, "mxGeometry", {"x": str(x), "y": str(y), "width": str(w), "height": str(h), "as": "geometry"})
        elif edge:
            geo = ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
        return cid

    # 1. System Boundary
    sys_style = "swimlane;startSize=36;html=1;whiteSpace=wrap;dashed=1;dashPattern=5 5;fillColor=#f8fafc;strokeColor=#475569;strokeWidth=2;fontStyle=1;fontSize=15;fontColor=#0f172a;rounded=1;arcSize=4;"
    sys_id = add_cell("Système : Plateforme Web TaskFlow (3 GLSI)", sys_style, x=220, y=40, w=1160, h=970)

    # 2. Actors Styles
    actor_visiteur_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#f1f5f9;strokeColor=#64748b;strokeWidth=2;fontSize=12;fontStyle=1;fontColor=#0f172a;"
    actor_employe_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#e0f2fe;strokeColor=#0284c7;strokeWidth=2;fontSize=12;fontStyle=1;fontColor=#0369a1;"
    actor_chef_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#f3e8ff;strokeColor=#9333ea;strokeWidth=2;fontSize=12;fontStyle=1;fontColor=#7e22ce;"
    actor_admin_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#fee2e2;strokeColor=#dc2626;strokeWidth=2;fontSize=12;fontStyle=1;fontColor=#b91c1c;"
    actor_system_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dcfce7;strokeColor=#16a34a;strokeWidth=2;fontSize=12;fontStyle=1;fontColor=#15803d;"

    # Add Left Actors
    visiteur_id = add_cell("Visiteur", actor_visiteur_style, x=60, y=110, w=45, h=80)
    employe_id = add_cell("Employé", actor_employe_style, x=60, y=340, w=45, h=80)
    chef_id = add_cell("Chef de projet", actor_chef_style, x=60, y=570, w=45, h=80)
    admin_id = add_cell("Administrateur", actor_admin_style, x=60, y=810, w=45, h=80)

    # Generalization (Inheritance) between actors: Chef -> Employe, Admin -> Chef
    gen_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=0;endSize=14;strokeWidth=2;strokeColor=#334155;"
    add_cell("", gen_style, edge=True, source=chef_id, target=employe_id)
    add_cell("", gen_style, edge=True, source=admin_id, target=chef_id)

    # Add Right Actors (Secondary / External Systems)
    socket_id = add_cell("&laquo;Acteur Système&raquo;&#xa;Service WebSocket&#xa;(Socket.io)", actor_system_style, x=1420, y=410, w=45, h=80)
    multer_id = add_cell("&laquo;Acteur Système&raquo;&#xa;Service Fichiers&#xa;(Multer)", actor_system_style, x=1420, y=650, w=45, h=80)

    # Styles for Packages / Modules inside system
    pkg_style = "swimlane;startSize=26;html=1;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#94a3b8;strokeWidth=1.5;rounded=1;arcSize=6;fontStyle=1;fontSize=12;fontColor=#1e293b;"
    
    # Styles for Use Cases
    uc_style_blue = "ellipse;whiteSpace=wrap;html=1;fillColor=#f0f9ff;strokeColor=#0284c7;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#0369a1;"
    uc_style_purple = "ellipse;whiteSpace=wrap;html=1;fillColor=#faf5ff;strokeColor=#9333ea;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#6b21a8;"
    uc_style_red = "ellipse;whiteSpace=wrap;html=1;fillColor=#fef2f2;strokeColor=#ef4444;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#991b1b;"
    uc_style_emerald = "ellipse;whiteSpace=wrap;html=1;fillColor=#ecfdf5;strokeColor=#10b981;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#065f46;"
    uc_style_amber = "ellipse;whiteSpace=wrap;html=1;fillColor=#fffbeb;strokeColor=#f59e0b;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#92400e;"

    # Connectors Styles
    assoc_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;strokeWidth=1.5;strokeColor=#64748b;"
    inc_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=4 4;endArrow=open;endSize=10;strokeWidth=1.5;strokeColor=#ea580c;fontSize=10;fontColor=#c2410c;fontStyle=1;"
    ext_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=4 4;endArrow=open;endSize=10;strokeWidth=1.5;strokeColor=#7c3aed;fontSize=10;fontColor=#6d28d9;fontStyle=1;"

    # ------------------
    # PKG 1: Authentification & Compte
    # ------------------
    pkg1 = add_cell("Module 1 : Authentification & Sécurité", pkg_style, parent=sys_id, x=20, y=40, w=540, h=170)
    uc01 = add_cell("UC-01 : S'inscrire&#xa;(rôle Employé par défaut)", uc_style_blue, parent=pkg1, x=20, y=35, w=150, h=50)
    uc02 = add_cell("UC-02 : S'authentifier&#xa;(JWT + Bcrypt)", uc_style_blue, parent=pkg1, x=190, y=35, w=150, h=50)
    uc03 = add_cell("UC-03 : Gérer son profil&#xa;&amp; mot de passe", uc_style_blue, parent=pkg1, x=20, y=100, w=150, h=50)
    uc04 = add_cell("UC-04 : Se déconnecter", uc_style_blue, parent=pkg1, x=190, y=100, w=150, h=50)
    uc_3d = add_cell("Interagir avec le&#xa;Gardien 3D (Three.js)", uc_style_amber, parent=pkg1, x=365, y=35, w=150, h=50)
    
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc_3d, target=uc02)

    # ------------------
    # PKG 2: Administration Système
    # ------------------
    pkg2 = add_cell("Module 2 : Administration Système &amp; Rôles", pkg_style, parent=sys_id, x=580, y=40, w=560, h=170)
    uc05 = add_cell("UC-05 : Consulter annuaire&#xa;des utilisateurs", uc_style_red, parent=pkg2, x=20, y=35, w=160, h=50)
    uc06 = add_cell("UC-06 : Modifier rôles&#xa;utilisateurs (RBAC)", uc_style_red, parent=pkg2, x=200, y=35, w=160, h=50)
    uc07 = add_cell("UC-07 : Supprimer un&#xa;compte utilisateur", uc_style_red, parent=pkg2, x=20, y=100, w=160, h=50)
    rg_user = add_cell("Vérifier intégrité&#xa;(RG-15, RG-16)", uc_style_amber, parent=pkg2, x=220, y=100, w=150, h=50)

    add_cell("&laquo;include&raquo;", inc_style, edge=True, source=uc07, target=rg_user)

    # ------------------
    # PKG 3: Gestion des Projets
    # ------------------
    pkg3 = add_cell("Module 3 : Gestion des Projets", pkg_style, parent=sys_id, x=20, y=230, w=540, h=200)
    uc08 = add_cell("UC-08 : Consulter la&#xa;liste des projets", uc_style_purple, parent=pkg3, x=20, y=40, w=150, h=50)
    uc09 = add_cell("UC-09 : Créer un projet", uc_style_purple, parent=pkg3, x=190, y=40, w=150, h=50)
    uc10 = add_cell("UC-10 : Modifier un projet", uc_style_purple, parent=pkg3, x=20, y=120, w=150, h=50)
    uc11 = add_cell("UC-11 : Supprimer un projet", uc_style_purple, parent=pkg3, x=190, y=120, w=150, h=50)
    rg_proj_del = add_cell("Vérifier absence tâches&#xa;actives (RG-02)", uc_style_amber, parent=pkg3, x=365, y=120, w=160, h=50)

    add_cell("&laquo;include&raquo;", inc_style, edge=True, source=uc11, target=rg_proj_del)

    # ------------------
    # PKG 4: Gestion des Tâches
    # ------------------
    pkg4 = add_cell("Module 4 : Gestion des Tâches &amp; Affectations", pkg_style, parent=sys_id, x=580, y=230, w=560, h=200)
    uc12 = add_cell("UC-12 : Créer &amp; affecter tâche&#xa;(RG-06, RG-07)", uc_style_purple, parent=pkg4, x=20, y=40, w=170, h=50)
    uc13 = add_cell("UC-13 : Modifier l'état&#xa;d'une tâche", uc_style_blue, parent=pkg4, x=210, y=40, w=160, h=50)
    uc14 = add_cell("UC-14 : Gérer checklist&#xa;de sous-tâches", uc_style_blue, parent=pkg4, x=20, y=120, w=160, h=50)
    uc15 = add_cell("UC-15 : Gérer pièces&#xa;jointes (Upload)", uc_style_blue, parent=pkg4, x=210, y=120, w=160, h=50)
    rg_recalc = add_cell("Recalculer avancement&#xa;projet (RG-08)", uc_style_amber, parent=pkg4, x=390, y=40, w=150, h=50)

    add_cell("&laquo;include&raquo;", inc_style, edge=True, source=uc13, target=rg_recalc)
    add_cell("&laquo;include&raquo;", inc_style, edge=True, source=uc12, target=rg_recalc)
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc14, target=uc12)
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc15, target=uc12)

    # ------------------
    # PKG 5: Vues & Planification
    # ------------------
    pkg5 = add_cell("Module 5 : Vues Multidimensionnelles &amp; Planification", pkg_style, parent=sys_id, x=20, y=450, w=1120, h=180)
    uc16 = add_cell("UC-16 : Vue Liste tabulaire", uc_style_emerald, parent=pkg5, x=20, y=45, w=170, h=50)
    uc17 = add_cell("UC-17 : Tableau Kanban&#xa;(Drag &amp; Drop interactif)", uc_style_emerald, parent=pkg5, x=210, y=45, w=180, h=50)
    uc18 = add_cell("UC-18 : Vue Calendrier&#xa;mensuel &amp; hebdo", uc_style_emerald, parent=pkg5, x=410, y=45, w=170, h=50)
    uc19 = add_cell("UC-19 : Chronogramme&#xa;Gantt / Timeline", uc_style_emerald, parent=pkg5, x=600, y=45, w=180, h=50)
    uc_filter = add_cell("Filtrer &amp; rechercher&#xa;(statut, priorité, membre)", uc_style_amber, parent=pkg5, x=850, y=45, w=180, h=50)

    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc_filter, target=uc16)
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc_filter, target=uc17)
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc_filter, target=uc18)
    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc_filter, target=uc19)

    # ------------------
    # PKG 6: Pilotage & Audit
    # ------------------
    pkg6 = add_cell("Module 6 : Tableau de Bord, Reporting &amp; Audit", pkg_style, parent=sys_id, x=20, y=650, w=1120, h=160)
    uc20 = add_cell("UC-20 : Consulter Dashboard&#xa;(7 indicateurs KPIs &amp; Jauges)", uc_style_blue, parent=pkg6, x=50, y=50, w=220, h=55)
    uc21 = add_cell("UC-21 : Exporter rapport&#xa;en fichier CSV", uc_style_blue, parent=pkg6, x=340, y=50, w=180, h=55)
    uc22 = add_cell("UC-22 : Consulter Journal&#xa;d'Audit en direct", uc_style_blue, parent=pkg6, x=600, y=50, w=200, h=55)

    add_cell("&laquo;extend&raquo;", ext_style, edge=True, source=uc21, target=uc20)

    # ------------------
    # Associations Acteurs -> Use Cases
    # ------------------
    # Visiteur
    add_cell("", assoc_style, edge=True, source=visiteur_id, target=uc01)
    add_cell("", assoc_style, edge=True, source=visiteur_id, target=uc02)

    # Employé
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc03)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc04)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc08)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc13)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc16)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc17)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc20)
    add_cell("", assoc_style, edge=True, source=employe_id, target=uc22)

    # Chef de projet
    add_cell("", assoc_style, edge=True, source=chef_id, target=uc09)
    add_cell("", assoc_style, edge=True, source=chef_id, target=uc10)
    add_cell("", assoc_style, edge=True, source=chef_id, target=uc11)
    add_cell("", assoc_style, edge=True, source=chef_id, target=uc12)

    # Administrateur
    add_cell("", assoc_style, edge=True, source=admin_id, target=uc05)
    add_cell("", assoc_style, edge=True, source=admin_id, target=uc06)
    add_cell("", assoc_style, edge=True, source=admin_id, target=uc07)

    # Services Externes
    add_cell("&laquo;notification&raquo;", ext_style, edge=True, source=uc13, target=socket_id)
    add_cell("&laquo;upload&raquo;", assoc_style, edge=True, source=uc15, target=multer_id)

    # Return XML string
    return ET.tostring(mxfile, encoding="utf-8", xml_declaration=True).decode("utf-8")

xml_output = generate_drawio()
drawio_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_cas_utilisation.drawio"
with open(drawio_path, "w", encoding="utf-8") as f:
    f.write(xml_output)

print(f"Draw.io file generated successfully at: {drawio_path}")
print("File size:", len(xml_output), "bytes")
