from __future__ import annotations

from typing import Any


DEFAULT_TEMPLATE_KEY = 'blank'

BOARD_TEMPLATES: dict[str, dict[str, Any]] = {
    'blank': {
        'name': 'Blank board',
        'description': 'Simple kanban board with 3 default lists.',
        'lists': ['To Do', 'In Progress', 'Done'],
        'labels': [],
    },
    'product_roadmap': {
        'name': 'Product roadmap',
        'description': 'Plan roadmap initiatives from idea to release.',
        'lists': ['Ideas', 'Planned', 'In Progress', 'Released'],
        'labels': [
            {'name': 'Feature', 'color': '#0079bf'},
            {'name': 'Improvement', 'color': '#61bd4f'},
            {'name': 'Research', 'color': '#f2d600'},
            {'name': 'Blocker', 'color': '#eb5a46'},
        ],
    },
    'bug_triage': {
        'name': 'Bug triage',
        'description': 'Track incoming bugs and prioritize fixes.',
        'lists': ['Inbox', 'Needs Repro', 'Ready to Fix', 'In QA', 'Done'],
        'labels': [
            {'name': 'P0', 'color': '#eb5a46'},
            {'name': 'P1', 'color': '#ff9f1a'},
            {'name': 'P2', 'color': '#f2d600'},
            {'name': 'P3', 'color': '#61bd4f'},
        ],
    },
}


def get_template_key_or_default(raw_key: str | None) -> str:
    key = (raw_key or '').strip() or DEFAULT_TEMPLATE_KEY
    return key if key in BOARD_TEMPLATES else DEFAULT_TEMPLATE_KEY


def get_board_template(raw_key: str | None) -> dict[str, Any]:
    return BOARD_TEMPLATES[get_template_key_or_default(raw_key)]


def list_board_templates() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for key, data in BOARD_TEMPLATES.items():
        items.append(
            {
                'key': key,
                'name': data['name'],
                'description': data['description'],
                'lists': list(data.get('lists', [])),
                'labels': list(data.get('labels', [])),
            }
        )
    return items
