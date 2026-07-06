"""
One-time cleanup script. Removes ml_results rows that don't have
a valid linked alert (leftover from earlier testing before live
pipeline wiring was complete).
Usage: python clear_stale_ml_results.py
"""
from models.database import SessionLocal
from models.ml_result import MLResult
from models.alert import Alert

db = SessionLocal()
valid_alert_ids = {str(a.id) for a in db.query(Alert.id).all()}
stale = db.query(MLResult).filter(
    (MLResult.alert_id == None) |
    (~MLResult.alert_id.in_(valid_alert_ids))
).all()
count = len(stale)
for row in stale:
    db.delete(row)
db.commit()
db.close()
print(f"Removed {count} stale ml_results rows without valid alert links.")
