from sqlalchemy import Column, Integer, SmallInteger, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from src.config.db import Base

class Valoracion(Base):
    __tablename__ = "Valoraciones"
    __table_args__ = (
        UniqueConstraint("id_usuario", "id_emprendimiento", name="UQ_Val_Usuario_Emp"),
    )
    id_valoracion     = Column(Integer,      primary_key=True, index=True)
    id_usuario        = Column(Integer,      ForeignKey("Usuarios.id_usuario"),              nullable=False)
    id_emprendimiento = Column(Integer,      ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    puntuacion        = Column(SmallInteger, nullable=False)
    fecha             = Column(DateTime,     server_default=func.getdate())

    usuario        = relationship("Usuario")
    emprendimiento = relationship("Emprendimiento", back_populates="valoraciones")
