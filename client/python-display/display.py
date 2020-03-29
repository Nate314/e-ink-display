#!/usr/bin/python
# -*- coding:utf-8 -*-
import sys
import os
imgdir = '../img'
libdir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib')
if os.path.exists(libdir):
    sys.path.append(libdir)

import logging
from waveshare_epd import epd4in2
import time
from PIL import Image,ImageDraw,ImageFont
import traceback

logging.basicConfig(level=logging.DEBUG)

try:

    logging.info("epd4in2 Demo")
    epd = epd4in2.EPD()
    logging.info("init and Clear")
    epd.init()
    epd.Clear()

    while True:
        logging.info("reading bmp file")
        MyImage = Image.open(os.path.join(imgdir, 'img.bmp'))
        epd.display(epd.getbuffer(MyImage))
        time.sleep(15)

except IOError as e:
    logging.info(e)

except KeyboardInterrupt:
    logging.info("ctrl + c:")
    epd4in2.epdconfig.module_exit()
    exit()
