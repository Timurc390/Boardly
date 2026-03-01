from __future__ import annotations

import calendar
from datetime import datetime, timedelta


def get_next_due_date(current_due_date: datetime, recurrence: str) -> datetime:
    if recurrence == 'daily':
        return current_due_date + timedelta(days=1)
    if recurrence == 'weekly':
        return current_due_date + timedelta(days=7)
    if recurrence == 'monthly':
        year = current_due_date.year
        month = current_due_date.month + 1
        if month > 12:
            month = 1
            year += 1
        last_day = calendar.monthrange(year, month)[1]
        day = min(current_due_date.day, last_day)
        return current_due_date.replace(year=year, month=month, day=day)
    return current_due_date
