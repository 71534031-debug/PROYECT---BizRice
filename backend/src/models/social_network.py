from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.db import Base

class RedSocial(Base):
    __tablename__ = "RedesSociales"
    id_red            = Column(Integer,     primary_key=True, index=True)
    id_emprendimiento = Column(Integer,     ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    plataforma        = Column(String(30),  nullable=False)
    url               = Column(String(255), nullable=False)

    emprendimiento = relationship("Emprendimiento", back_populates="redes_sociales")
