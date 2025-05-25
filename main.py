from mi_app.twitch.twitchConnector import run_twitch_bot
from mi_app.ui.window import launch_app

if __name__ == "__main__":
    TOKEN = "67snyzqx4rmyqjz2tn1u2cpcastz3w"  # Reemplaza por tu token real
    CHANNEL = "Daskind19"  # Reemplaza por tu canal
    run_twitch_bot(TOKEN, CHANNEL)
    launch_app()