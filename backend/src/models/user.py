from sqlalchemy import Column, Integer, String, DateTime, func
from src.config.db import Base

class Usuario(Base):
    __tablename__ = "Usuarios"
    id_usuario      = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String(100), nullable=False)
    apellido        = Column(String(100), nullable=False)
    correo          = Column(String(150), unique=True, nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)
    rol             = Column(String(20),  nullable=False, default="emprendedor")
    estado          = Column(String(20),  nullable=False, default="activo")
    avatar_url      = Column(String(255), nullable=True)
    fecha_registro  = Column(DateTime, server_default=func.getdate())
