from sqlalchemy import Column, Integer, String, Text, DateTime, Time, ForeignKey, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Emprendimiento(Base):
    __tablename__ = "Emprendimientos"
    id_emprendimiento   = Column(Integer, primary_key=True, index=True)
    id_usuario          = Column(Integer, ForeignKey("Usuarios.id_usuario"),    nullable=False)
    id_categoria        = Column(Integer, ForeignKey("Categorias.id_categoria"), nullable=False)
    nombre              = Column(String(150), nullable=False)
    descripcion         = Column(Text,        nullable=True)
    telefono            = Column(String(20),  nullable=True)
    direccion           = Column(String(255), nullable=True)
    distrito            = Column(String(100), nullable=True)
    horario_apertura    = Column(Time,        nullable=True)
    horario_cierre      = Column(Time,        nullable=True)
    imagen_portada_url  = Column(String(255), nullable=True)
    estado_verificacion = Column(String(20),  nullable=False, default="pendiente")
    fecha_registro      = Column(DateTime, server_default=func.getdate())

    propietario    = relationship("Usuario",    foreign_keys=[id_usuario])
    categoria      = relationship("Categoria",  foreign_keys=[id_categoria])
    productos      = relationship("Producto",   back_populates="emprendimiento")
    comentarios    = relationship("Comentario", back_populates="emprendimiento")
    valoraciones   = relationship("Valoracion", back_populates="emprendimiento")
    promociones    = relationship("Promocion",  back_populates="emprendimiento")
    redes_sociales = relationship("RedSocial",  back_populates="emprendimiento")
