from PyQt5.QtWidgets import QApplication, QLabel, QWidget, QVBoxLayout
import sys

def launch_app():
    app = QApplication(sys.argv)
    window = QWidget()
    window.setWindowTitle('PNGTuber App')
    layout = QVBoxLayout()
    layout.addWidget(QLabel('Hola PNGTuber 👾'))
    window.setLayout(layout)
    window.show()
    sys.exit(app.exec_())