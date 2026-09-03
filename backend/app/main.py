"""
App entrypoint.

Nest analogy: this is your main.ts + AppModule combined. `app = FastAPI(...)`
is like `NestFactory.create(AppModule)`, and `include_router` is like
registering a controller's module in `imports: []`.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import health, users
from app.api.routes import vault
from app.api.routes import auth
from app.core.config import get_settings
from app.core.exceptions import AppException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

settings = get_settings()

app = FastAPI(
    title="Pass Hive API",
    version="0.1.0",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # add prod domain later
    allow_credentials=True,  # required, or the browser won't send/accept the cookie
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(vault.router)


@app.exception_handler(AppException)
async def app_execption_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"code": "VALIDATION_ERROR", "message": exc.errors()},
    )


# catch-all safety net for anything unhandled
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "Something went wrong"},
    )


@app.get("/")
async def root() -> dict:
    return {"service": "pass-hive", "environment": settings.environment}
