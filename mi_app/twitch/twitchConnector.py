from twitchio.ext import commands

class TwitchBot(commands.Bot):
    def __init__(self, token, prefix, initial_channels):
        super().__init__(token=token, prefix=prefix, initial_channels=initial_channels)

    async def event_ready(self):
        print(f"Bot conectado exitosamente a Twitch con {self.nick}")

def run_twitch_bot(token, channel):
    bot = TwitchBot(
        token=token,
        prefix="!",
        initial_channels=[channel]
    )
    bot.run()