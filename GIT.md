# Git Workflow

## Ramas

| Rama | Uso |
|---|---|
| `main` | Siempre funciona. Nunca trabajar directo acá. |
| `feature/nombre` | Una rama por funcionalidad |
| `fix/nombre` | Corrección de bug |
| `chore/nombre` | Configuración, dependencias |

---

## Flujo del día a día

```bash
# 1. Antes de arrancar algo nuevo
git checkout main
git checkout -b feature/nombre-de-la-tarea

# 2. Trabajar y commitear seguido
git add archivo.ts
git commit -m "feat: descripción corta"

# 3. Cuando la funcionalidad está terminada y funciona
git checkout main
git merge feature/nombre-de-la-tarea
git push origin main

# 4. Borrar la rama ya mergeada (opcional)
git branch -d feature/nombre-de-la-tarea
```

---

## Mensajes de commit

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | funcionalidad nueva |
| `fix:` | corrección de bug |
| `chore:` | configuración, dependencias |
| `docs:` | documentación |
| `refactor:` | cambio de código sin cambiar comportamiento |
| `test:` | tests |

---

## Comandos útiles

```bash
git status                  # ver qué cambió
git log --oneline           # historial resumido
git branch                  # ver todas las ramas locales
git checkout -              # volver a la rama anterior
git diff                    # ver cambios no commiteados
```
