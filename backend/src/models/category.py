from sqlalchemy import Column, Integer, String
from src.config.db import Base

class Categoria(Base):
    __tablename__ = "Categorias"
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(100), nullable=False)
    descripcion  = Column(String(255), nullable=True)
    icono_url    = Column(String(255), nullable=True)
