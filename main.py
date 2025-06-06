from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import RedirectResponse, FileResponse, JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
import json
from typing import List, Dict

app = FastAPI()

logging.basicConfig(level=logging.INFO)

load_dotenv()

# CORS middleware: allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],  # Set your deployed frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React static files
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
app.mount("/static", StaticFiles(directory="frontend/dist"), name="static")


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_netlist_json(json_str: str) -> List[str]:
    errors: List[str] = []

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        return [f"Invalid JSON: {e}"]

    if not isinstance(data, dict):
        errors.append("Top-level JSON must be an object")
        return errors

    components = data.get("components")
    nets = data.get("nets")

    if not isinstance(components, list):
        errors.append("'components' must be a list")
        components = []
    if not isinstance(nets, list):
        errors.append("'nets' must be a list")
        nets = []

    component_map: Dict[str, Dict[str, str]] = {}

    for idx, comp in enumerate(components):
        if not isinstance(comp, dict):
            errors.append(f"Component at index {idx} is not an object")
            continue

        missing_fields = [field for field in ["id", "type", "value", "pins"] if field not in comp]
        if missing_fields:
            errors.append(f"Component at index {idx} is missing fields: {missing_fields}")
            continue

        if not isinstance(comp["pins"], dict):
            errors.append(f"Component '{comp.get('id', 'unknown')}' has 'pins' that is not a dict")
            continue

        component_map[comp["id"]] = comp

    for idx, net in enumerate(nets):
        if not isinstance(net, dict):
            errors.append(f"Net at index {idx} is not an object")
            continue

        if "id" not in net or "nodes" not in net:
            errors.append(f"Net at index {idx} missing 'id' or 'nodes'")
            continue

        if not isinstance(net["nodes"], list):
            errors.append(f"Net '{net.get('id', 'unknown')}' has 'nodes' that is not a list")
            continue

        for node in net["nodes"]:
            if not isinstance(node, str) or "." not in node:
                errors.append(f"Net '{net['id']}' contains malformed node '{node}' (must be like 'V1.positive')")
                continue

            comp_id, pin_name = node.split(".", 1)
            component = component_map.get(comp_id)
            if not component:
                errors.append(f"Net '{net['id']}' references unknown component '{comp_id}'")
                continue

            if pin_name not in component["pins"]:
                errors.append(f"Net '{net['id']}' references unknown pin '{pin_name}' on component '{comp_id}'")
                continue

            expected_net_id = component["pins"][pin_name]
            if expected_net_id != net["id"]:
                errors.append(
                    f"Node '{node}' in net '{net['id']}' does not match component '{comp_id}' pin mapping')."
                )

    return errors

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    file_str = contents.decode("utf-8")
    
    errors: List = validate_netlist_json(file_str)

    message: str = "Upload successful" if len(errors) == 0 else "Upload failed"

    return JSONResponse({
        "filename": file.filename,
        "message": message,
        "content": file_str,
        "errors": errors
    })

# Fallback: Serve index.html for all other routes (SPA support)
@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_spa(full_path: str):
    return FileResponse("frontend/dist/index.html")