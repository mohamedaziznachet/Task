import os
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import subprocess

def generate_sequence_drawio():
    mxfile = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": "2026-11-04T23:10:00.000Z",
        "agent": "Antigravity UML Agent",
        "version": "24.0.0",
        "type": "device"
    })
    
    diagram = ET.SubElement(mxfile, "diagram", {
        "id": "seq_taskflow",
        "name": "Diagramme de Séquence - TaskFlow"
    })
    
    graphModel = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1400",
        "dy": "900",
        "grid": "1",
        "gridSize": "10",
        "guides": "1",
        "tooltips": "1",
        "connect": "1",
        "arrows": "1",
        "fold": "1",
        "page": "1",
        "pageScale": "1",
        "pageWidth": "1400",
        "pageHeight": "900",
        "math": "0",
        "shadow": "0"
    })
    
    root = ET.SubElement(graphModel, "root")
    
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})
    
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
            ET.SubElement(cell, "mxGeometry", {"x": str(x), "y": str(y), "width": str(w), "height": str(h), "as": "geometry"})
        elif edge:
            ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
        return cid

    # Titre du diagramme
    title_style = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=16;fontStyle=1;fontColor=#0f172a;"
    add_cell("Diagramme de Séquence Système : Mise à jour d'une Tâche &amp; Recalcul d'Avancement (RG-08)", title_style, x=150, y=20, w=900, h=40)

    # Lifelines Styles
    actor_lifeline_style = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#e0f2fe;strokeColor=#0284c7;strokeWidth=2;fontStyle=1;fontColor=#0369a1;fontSize=12;size=50;"
    boundary_lifeline_style = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#f0fdf4;strokeColor=#16a34a;strokeWidth=2;fontStyle=1;fontColor=#15803d;fontSize=12;size=50;"
    control_lifeline_style = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#faf5ff;strokeColor=#9333ea;strokeWidth=2;fontStyle=1;fontColor=#6b21a8;fontSize=12;size=50;"
    entity_lifeline_style = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#fffbeb;strokeColor=#f59e0b;strokeWidth=2;fontStyle=1;fontColor=#92400e;fontSize=12;size=50;"
    system_lifeline_style = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#fef2f2;strokeColor=#ef4444;strokeWidth=2;fontStyle=1;fontColor=#991b1b;fontSize=12;size=50;"

    # Add 5 Lifelines
    p1 = add_cell("👤 Collaborateur\n(Employé / Chef)", actor_lifeline_style, x=80, y=80, w=120, h=650)
    p2 = add_cell("🖥️ Interface React\n(Vue Kanban)", boundary_lifeline_style, x=300, y=80, w=130, h=650)
    p3 = add_cell("⚙️ Serveur Express\n(API REST)", control_lifeline_style, x=530, y=80, w=130, h=650)
    p4 = add_cell("💾 Base MongoDB\n(Tâches &amp; Projets)", entity_lifeline_style, x=760, y=80, w=130, h=650)
    p5 = add_cell("⚡ Socket.io\n(Service Temps Réel)", system_lifeline_style, x=990, y=80, w=130, h=650)

    # Styles for Messages
    sync_call_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=1.8;strokeColor=#1e293b;fontSize=11;fontStyle=1;fontColor=#0f172a;"
    async_call_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=open;strokeWidth=1.8;strokeColor=#7c3aed;fontSize=11;fontStyle=1;fontColor=#6d28d9;"
    reply_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=4 4;endArrow=open;strokeWidth=1.5;strokeColor=#64748b;fontSize=11;fontColor=#475569;"
    self_call_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=1.5;strokeColor=#9333ea;fontSize=11;fontStyle=1;fontColor=#6b21a8;"

    # Activation Bars
    act_style = "html=1;points=[];perimeter=orthogonalPerimeter;fillColor=#e2e8f0;strokeColor=#94a3b8;strokeWidth=1;"
    add_cell("", act_style, parent=p1, x=55, y=90, w=10, h=510)
    add_cell("", act_style, parent=p2, x=60, y=100, w=10, h=490)
    add_cell("", act_style, parent=p3, x=60, y=160, w=10, h=370)
    add_cell("", act_style, parent=p4, x=60, y=210, w=10, h=220)
    add_cell("", act_style, parent=p5, x=60, y=470, w=10, h=70)

    # Sequence Messages
    # 1. Drag & Drop
    add_cell("1: Glisser-déposer la carte (ex: vers 'Terminée')", sync_call_style, edge=True, source=p1, target=p2)
    
    # 2. HTTP Request
    add_cell("2: PATCH /api/tasks/:id { statut: 'Terminée' } (Token JWT)", sync_call_style, edge=True, source=p2, target=p3)
    
    # 3. Validation & Auth
    add_cell("3: Vérification JWT &amp; Rôle (RBAC)", self_call_style, edge=True, source=p3, target=p3)

    # 4. DB Update Task
    add_cell("4: UpdateOne({ _id }, { status: 'Terminée' })", sync_call_style, edge=True, source=p3, target=p4)
    
    # 5. DB Confirmation
    add_cell("5: Tâche mise à jour", reply_style, edge=True, source=p4, target=p3)

    # 6. RG-08 Auto recalculation
    add_cell("6: Recalcul automatique avancement projet (RG-08)", sync_call_style, edge=True, source=p3, target=p4)
    
    # 7. DB Confirmation avancement
    add_cell("7: Nouveau pourcentage enregistré", reply_style, edge=True, source=p4, target=p3)

    # 8. Notification temps réel
    add_cell("8: Diffuser événement ('task:updated', données)", async_call_style, edge=True, source=p3, target=p5)

    # 9. HTTP Response
    add_cell("9: 200 OK { tâche, avancementProjet: 85% }", reply_style, edge=True, source=p3, target=p2)

    # 10. Broadcast aux autres clients
    add_cell("10: Broadcast WebSocket (Autres collaborateurs)", async_call_style, edge=True, source=p5, target=p2)

    # 11. UI Update
    add_cell("11: Actualisation vue Kanban &amp; notification toast", reply_style, edge=True, source=p2, target=p1)

    return ET.tostring(mxfile, encoding="utf-8", xml_declaration=True).decode("utf-8")

raw_xml = generate_sequence_drawio()
dom = minidom.parseString(raw_xml)
pretty_xml = dom.toprettyxml(indent="  ")
cleaned_xml = "\n".join([line for line in pretty_xml.split("\n") if line.strip()])

drawio_path = r"C:\Users\DELL\Desktop\tasks\Task\diagramme_sequence.drawio"
with open(drawio_path, "w", encoding="utf-8") as f:
    f.write(cleaned_xml)

print("Saved Draw.io Sequence diagram to:", drawio_path)
