from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from core.models import Board, Membership


def _is_valid_action_type(value):
    if not isinstance(value, str):
        return False
    if len(value) > 128:
        return False
    return value.startswith("board/") and value.endswith("/fulfilled")


class BoardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"].get("board_id")
        self.group_name = f"board_{self.board_id}"

        user = self.scope.get("user", AnonymousUser())
        if user.is_anonymous:
            await self.close()
            return

        has_access = await self._user_has_access(user.id, self.board_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict):
            return

        msg_type = content.get("type")
        if msg_type != "board_updated":
            return

        action_type = content.get("action_type")
        if not _is_valid_action_type(action_type):
            return

        incoming_board_id = content.get("board_id")
        if incoming_board_id is not None and str(incoming_board_id) != str(self.board_id):
            return

        user = self.scope.get("user", AnonymousUser())
        if user.is_anonymous:
            return

        payload = {
            "type": "board.broadcast",
            "action_type": action_type,
            "payload": content.get("payload"),
            "sender_id": user.id,
            "board_id": self.board_id,
        }
        await self.channel_layer.group_send(self.group_name, payload)

    async def board_broadcast(self, event):
        await self.send_json({
            "type": "board_updated",
            "action_type": event.get("action_type"),
            "payload": event.get("payload"),
            "sender_id": event.get("sender_id"),
            "board_id": event.get("board_id"),
        })

    @database_sync_to_async
    def _user_has_access(self, user_id, board_id):
        if not board_id:
            return False
        return Board.objects.filter(id=board_id, owner_id=user_id).exists() or \
            Membership.objects.filter(board_id=board_id, user_id=user_id).exists()
