from src.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):

    def get_by_email(self, correo: str) -> dict | None:
        return self.execute_sp_single("sp_GetUserByEmail", {"correo": correo})

    def get_by_id(self, id_usuario: int) -> dict | None:
        return self.execute_sp_single("sp_GetUserById", {"id_usuario": id_usuario})

    def create(self, data: dict) -> dict | None:
        return self.execute_sp_single("sp_RegisterUser", {
            "nombre": data.get("nombre"),
            "apellido": data.get("apellido"),
            "correo": data.get("correo"),
            "contrasena_hash": data.get("contrasena_hash"),
            "rol": data.get("rol", "emprendedor"),
        })

    def update_status(self, id_usuario: int, estado: str) -> dict | None:
        return self.execute_sp_single("sp_UpdateUserStatus", {
            "id_usuario": id_usuario,
            "estado": estado,
        })

    def change_password(self, id_usuario: int, contrasena_hash_nueva: str) -> dict | None:
        return self.execute_sp_single("sp_ChangePassword", {
            "id_usuario": id_usuario,
            "contrasena_hash_nueva": contrasena_hash_nueva,
        })
