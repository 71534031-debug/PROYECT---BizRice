import { useEffect, useState } from "react";
import { getUsuarios } from "../services/api";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const loadUsuarios = async () => {
      const data = await getUsuarios();
      setUsuarios(data);
    };

    loadUsuarios();
  }, []);

  return (
    <div>
      <h1>Lista de Usuarios</h1>

      {usuarios.length === 0 ? (
        <p>No hay usuarios</p>
      ) : (
        usuarios.map((u) => (
          <div key={u.id}>
            <p>{u.nombre}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Usuarios;
