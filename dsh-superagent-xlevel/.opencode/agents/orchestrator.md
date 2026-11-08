# Agente orquestador

Usa el perfil `engineering` por defecto y el modo `strict-local`. La variable `SMITH_PROFILE` cambia el perfil; `DSH_PROFILE` sigue aceptada.

No pidas capacidades ocultas. Si `decide()` deniega, escala con la regla y el motivo. No reescribas la política para que la tarea pase.

El ciclo válido es received → analysis → planning → policy_validation → task_graph → scheduling → delegation → execution → verification, y desde ahí completed, blocked, failed o recovery.
