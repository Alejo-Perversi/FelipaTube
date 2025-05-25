from PyQt5.QtWidgets import QApplication, QLabel, QWidget, QVBoxLayout, QPushButton
import sys

def launch_app():
    app = QApplication(sys.argv)
    window = QWidget()
    window.setWindowTitle('PNGTuber App')
    layout = QVBoxLayout()
    layout.addWidget(QLabel('Hola PNGTuber 👾'))
    btn_conectar = QPushButton('Conectar')
    layout.addWidget(btn_conectar)
    window.setLayout(layout)
    window.show()
    sys.exit(app.exec_())