This summer I wanted to delve into the weeds of shader programming.  I also wanted to explore the capabilities of browser based rendering so I mucked around and made some stuff with WebGL.  This repo contains a cuttable cloth simulation, a basic interactive professional website ('ripple.html'), and a Simplex noise demo I made to learn deferred shading.

Many thanks to <a href="https://github.com/tsherif">Tarek Sherif</a> for the awesome <a href="https://github.com/tsherif/picogl.js?files=1">picogl library</a>.  I strongly recommend it to anyone interested in learning basic/intermediate graphics programming concepts.  It abstracts away the pedantics of raw WebGL while still exposing the fundementals of GPU state management.

The physics of the cloth simulation behind the fake resume was <a href="https://tsherif.github.io/picogl.js">implemented by Tarek</a> and I reverse engineered his design to include cuttability.  I use code from his other examples and it's credited when used. 
