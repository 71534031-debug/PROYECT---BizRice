from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Comentario(Base):
    __tablename__ = "Comentarios"
    id_comentario     = Column(Integer, primary_key=True, index=True)
    id_usuario        = Column(Integer, ForeignKey("Usuarios.id_usuario"),              nullable=False)
    id_emprendimiento = Column(Integer, ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    contenido         = Column(Text,    nullable=False)
    util_count        = Column(Integer, nullable=False, default=0)
    fecha             = Column(DateTime, server_default=func.now())

    usuario        = relationship("Usuario",         foreign_keys=[id_usuario])
    emprendimiento = relationship("Emprendimiento",  back_populates="comentarios")
