import argparse
import hashlib
import json
import mailbox
import os
import re
import tempfile
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime


DIMENSIONS = [
    ("S", "Strategic Architecture"),
    ("C", "Commercial Engine"),
    ("A", "Analytics"),
    ("L", "Leadership Institutionalization"),
    ("E", "Execution"),
    ("G", "Governance"),
]


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def decode(value):
    return str(make_header(decode_header(value or "")))


def parse_date(value):
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except Exception:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_body(message):
    plains = []
    htmls = []
    parts = message.walk() if message.is_multipart() else [message]
    for part in parts:
        if part.get_filename():
            continue
        content_type = part.get_content_type()
        if content_type not in ("text/plain", "text/html"):
            continue
        raw = part.get_payload(decode=True) or b""
        text = raw.decode(part.get_content_charset() or "utf-8", "replace")
        if content_type == "text/plain":
            plains.append(text)
        else:
            htmls.append(text)
    return "\n".join(plains or htmls)


def field(text, label):
    match = re.search(rf"{re.escape(label)}:\s*(.+)", text, re.I)
    return clean(match.group(1)) if match else ""


def stable_id(value):
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]
    return f"import_{digest}"


def record_key(form_data):
    email = clean(form_data.get("email", "")).lower()
    if email:
        return email
    return "|".join(
        clean(form_data.get(key, "")).lower()
        for key in ("nome", "whatsapp", "localizacao", "faturamento")
    )


def parse_score(text):
    match = re.search(r"SCORE GERAL\s+(\d+)\s+([^\n]+)", text)
    if not match:
        return 0, ""
    return int(match.group(1)), clean(match.group(2))


def parse_dimensions(text):
    start = text.find("DIMENSÕES SCALE")
    end = text.find("⚠ GARGALO CRÍTICO")
    if start == -1 or end == -1:
        return {}

    block = text[start + len("DIMENSÕES SCALE") : end]
    markers = []
    for key, name in DIMENSIONS:
        pattern = re.escape(f"{key}{name}") + r"\s*(\d{1,3})"
        match = re.search(pattern, block)
        if match:
            markers.append((match.start(), match.end(), key, name, int(match.group(1))))

    markers.sort()
    result = {}
    for index, (_, marker_end, key, _name, score) in enumerate(markers):
        next_start = markers[index + 1][0] if index + 1 < len(markers) else len(block)
        tail = clean(block[marker_end:next_start])
        gargalo = ""
        status = tail
        if "↳" in tail:
            before, after = tail.split("↳", 1)
            status = clean(before)
            gargalo = clean(after)
        result[key] = {
            "score": score,
            "status": status,
            "gargalo": gargalo or None,
        }
    return result


def between(text, start_label, end_label):
    start = text.find(start_label)
    if start == -1:
        return ""
    start += len(start_label)
    end = text.find(end_label, start) if end_label else -1
    return clean(text[start:end if end != -1 else None])


def parse_priorities(text):
    block = between(text, "PRIORIDADES DE AÇÃO", "INVESTIGAÇÃO SETORIAL")
    if not block:
        return []
    items = re.split(r"\s*0?[1-9](?=[A-ZÁÉÍÓÚÃÕÂÊÔÇ])", block)
    return [clean(item) for item in items if clean(item)]


def parse_report(text, form_data):
    score, nivel = parse_score(text)
    company = field(text, "Empresa")
    lead_match = re.search(r"Lead:\s*([^·\n]+)\s*·\s*([^\s\n]+)", text)
    if lead_match:
        form_data["nome"] = clean(lead_match.group(1)) or form_data.get("nome", "")
        form_data["email"] = clean(lead_match.group(2)).lower() or form_data.get("email", "")

    return {
        "tipo": "relatorio",
        "nome": form_data.get("nome", ""),
        "empresa": company,
        "email": form_data.get("email", ""),
        "whatsapp": form_data.get("whatsapp", ""),
        "faturamento": form_data.get("faturamento", ""),
        "localizacao": form_data.get("localizacao", ""),
        "score_geral": score,
        "nivel": nivel,
        "dimensoes": parse_dimensions(text),
        "gargalo_critico": between(text, "⚠ GARGALO CRÍTICO", "PRIORIDADES DE AÇÃO"),
        "prioridades": parse_priorities(text),
        "parecer": between(text, nivel, "DIMENSÕES SCALE") if nivel else "",
        "setor_insights": between(text, "INVESTIGAÇÃO SETORIAL · MASTERBOARD", "Principal desafio"),
        "ecossistema_match": between(text, "ECOSSISTEMA MASTERBOARD", "Lead:"),
        "masterboard_tabela": [],
    }


def parse_message(message):
    subject = decode(message.get("subject", ""))
    text = read_body(message)
    imported_at = parse_date(message.get("date", ""))
    is_diagnostic = "[Diagnóstico]" in subject
    is_lead = "[Lead Cadastrado]" in subject
    if not is_diagnostic and not is_lead:
        return None

    form_data = {
        "nome": field(text, "Nome"),
        "email": field(text, "Email").lower(),
        "whatsapp": field(text, "WhatsApp"),
        "faturamento": field(text, "Faturamento"),
        "localizacao": field(text, "Localização"),
    }

    report = parse_report(text, form_data) if is_diagnostic else None
    if report:
        form_data.update(
            {
                "nome": report.get("nome") or form_data.get("nome", ""),
                "email": report.get("email") or form_data.get("email", ""),
                "whatsapp": report.get("whatsapp") or form_data.get("whatsapp", ""),
                "faturamento": report.get("faturamento") or form_data.get("faturamento", ""),
                "localizacao": report.get("localizacao") or form_data.get("localizacao", ""),
            }
        )

    key = record_key(form_data) or stable_id(subject + imported_at)
    return {
        "key": key,
        "type": "diagnostic" if is_diagnostic else "lead",
        "subject": subject,
        "importedAt": imported_at,
        "formData": form_data,
        "report": report,
        "conversation": between(text, "HISTÓRICO DA CONVERSA", "RESPOSTAS DO LEAD"),
        "answers": between(text, "RESPOSTAS DO LEAD", None),
    }


def merge_records(messages):
    grouped = {}
    duplicate_messages = 0
    for item in messages:
        key = item["key"]
        existing = grouped.get(key)
        if existing:
            duplicate_messages += 1
        lead_id = stable_id(key)
        record = grouped.setdefault(
            key,
            {
                "leadId": lead_id,
                "status": "captured",
                "createdAt": item["importedAt"],
                "updatedAt": item["importedAt"],
                "formData": {"leadId": lead_id},
                "events": [],
            },
        )
        if item["importedAt"] < record["createdAt"]:
            record["createdAt"] = item["importedAt"]
        if item["importedAt"] > record["updatedAt"]:
            record["updatedAt"] = item["importedAt"]

        for field_name, value in item["formData"].items():
            if value:
                record["formData"][field_name] = value
        record["formData"]["leadId"] = lead_id

        if item["type"] == "diagnostic":
            record["status"] = "completed"
            record["completedAt"] = item["importedAt"]
            record["report"] = item["report"]
            record["conversation"] = item["conversation"]
            record["answers"] = item["answers"]
            record["events"].append({"type": "historical_diagnostic_email", "at": item["importedAt"]})
        else:
            record["events"].append({"type": "historical_lead_email", "at": item["importedAt"]})

    return list(grouped.values()), duplicate_messages


def load_messages(zip_path):
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(zip_path) as archive:
            names = archive.namelist()
            mbox_name = next((name for name in names if name.lower().endswith(".mbox")), None)
            if not mbox_name:
                raise SystemExit("Nenhum arquivo .mbox encontrado no ZIP.")
            archive.extract(mbox_name, tmp)
        box = mailbox.mbox(os.path.join(tmp, mbox_name))
        try:
            return [parsed for message in box if (parsed := parse_message(message))]
        finally:
            box.close()


def post_import(endpoint, token, records):
    data = json.dumps({"confirm": "IMPORT_HISTORY", "records": records}).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description="Importa emails historicos do Archie para o dashboard.")
    parser.add_argument("--zip", required=True, help="Caminho do ZIP exportado do webmail.")
    parser.add_argument("--endpoint", default="https://masterboard-scale.netlify.app/api/import-history")
    parser.add_argument("--token", default=os.environ.get("DASHBOARD_TOKEN", ""))
    parser.add_argument("--commit", action="store_true", help="Grava no dashboard. Sem isso, faz apenas dry-run.")
    args = parser.parse_args()

    parsed_messages = load_messages(args.zip)
    records, duplicate_messages = merge_records(parsed_messages)
    summary = {
        "parsed_messages": len(parsed_messages),
        "records": len(records),
        "completed": sum(1 for record in records if record.get("status") == "completed"),
        "lead_only": sum(1 for record in records if record.get("status") != "completed"),
        "duplicate_messages": duplicate_messages,
        "sample": [
            {
                "leadId": record.get("leadId"),
                "status": record.get("status"),
                "nome": record.get("report", {}).get("nome") or record.get("formData", {}).get("nome"),
                "empresa": record.get("report", {}).get("empresa", ""),
                "email": record.get("formData", {}).get("email", ""),
                "score": record.get("report", {}).get("score_geral", 0),
            }
            for record in records[:10]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if not args.commit:
        print("DRY_RUN: nenhum registro foi gravado.")
        return

    if not args.token:
        raise SystemExit("Token ausente. Informe --token ou DASHBOARD_TOKEN.")

    status, response = post_import(args.endpoint, args.token, records)
    print(json.dumps({"status": status, "response": response}, ensure_ascii=False, indent=2))
    if status >= 400:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
