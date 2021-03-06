/**
 * Copyright (C) 2013-2016, Markus Sprunck
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: -
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer. - Redistributions in binary
 * form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided
 * with the distribution. - The name of its contributor may be used to endorse
 * or promote products derived from this software without specific prior written
 * permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 * 
 */

/**
 * Global constants
 */
var BORDER_BOTTOM = 30;

/**
 * Just for development to rotate scene
 */
var USE_ORBIT_CONTROLS = (document.location.search === "?orbitControls=true");
;

/**
 * Global variables for rendering
 */
var g_panelWidthWebGL;
var g_panelHeightWebGL;
var g_scene;
var g_cube_wireframe;
var g_controls;
var g_gui;
var detectorPosition = {
	x : 0,
	y : 0
};
var g_stats, g_camera, g_scene, g_renderer;
var g_motionDetector;
var g_teddy;

function init() {

	console.log('THREE.MotionDetector 2');

	// Add container
	g_scene = new THREE.Scene();
	g_scene.fog = new THREE.FogExp2(0xffffff, 0.0004);
	var container = document.getElementById('drawingArea');

	// Add camera
	var HEIGHT = window.innerHeight;
	var WIDTH = window.innerWidth;
	g_camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 1, 3000);
	g_scene.add(g_camera);

	// Add renderer
	g_renderer = new THREE.WebGLRenderer({
		alpha : true,
		antialias : true
	});
	g_renderer.shadowMap.enabled = true;
	g_renderer.setClearColor(0xbbd7e9, 1);
	container.appendChild(g_renderer.domElement);

	// Add motion detector
	g_motionDetector = new SimpleMotionDetector(g_camera);
	g_motionDetector.init();
	container.appendChild(g_motionDetector.domElement);

	if (USE_ORBIT_CONTROLS) {
		g_controls = new THREE.OrbitControls(g_camera, g_renderer.domElement);
		g_controls.enableDamping = true;
		g_controls.dampingFactor = 0.25;
		g_controls.enableZoom = true;
		g_camera.position.set(g_camera.position.x, g_camera.position.y + 100, g_camera.position.z + 600);
	} else {
		g_camera.position.set(0, 150, 500);
		g_camera.lookAt(0, 150, 0);
	}

	// Add dialog to change parameters
	g_gui = new dat.GUI({
		autoPlace : false,
		width : 312
	});
	var folder = g_gui.addFolder('Motion Detector Settings');
	folder.add(g_motionDetector, 'offsetAlpha', -60.0, 20.0, 10).name('Offset α');
	folder.add(g_motionDetector, 'offsetGamma', -60.0, 20.0, 10).name('Offset γ');
	folder.add(g_motionDetector, 'amplificationAlpha', 0.1, 0.4, 0.1).name('Amplification α');
	folder.add(g_motionDetector, 'amplificationGamma', 0.1, 0.4, 0.1).name('Amplification γ');
	folder.add(g_motionDetector, 'detectionBorder', 0.25, 1.0, 0.05).name('Detection border');
	folder.add(g_motionDetector, 'pixelThreshold', 0, 250, 10).name('Pixel threshold');
	folder.add(g_motionDetector.averageX, 'maxLength', 50, 500, 50).name('Averager X');
	folder.add(g_motionDetector.averageY, 'maxLength', 50, 500, 50).name('Averager Y');
	folder.open();

	g_gui.domElement.style.position = 'absolute';
	g_gui.domElement.style.right = '10px';
	g_gui.domElement.style.top = '10px';
//	g_gui.close();
	container.appendChild(g_gui.domElement);

	// Support window resize
	var resizeCallback = function() {
		g_panelWidthWebGL = window.innerWidth  ;
		g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM;

		var devicePixelRatio = window.devicePixelRatio || 1;
		g_renderer.setSize(g_panelWidthWebGL * devicePixelRatio, g_panelHeightWebGL * devicePixelRatio);
		g_renderer.domElement.style.width = g_panelWidthWebGL + 'px';
		g_renderer.domElement.style.height = g_panelHeightWebGL + 'px';
		g_camera.aspect = window.innerWidth / window.innerHeight;
		g_camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', resizeCallback, false);
	resizeCallback();

	createLights();
	createFloor();
	createTeddy();
}

function createLights() {

	var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x101010, 0.9)
	g_scene.add(hemisphereLight);

	var ambientLight = new THREE.AmbientLight(0x2f2f2f)
	g_scene.add(ambientLight);

	var sunLight = new THREE.DirectionalLight(0x606060, 0.30);
	sunLight.position.set(300, 600, 500);
	sunLight.castShadow = true;
	sunLight.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera());
	g_scene.add(sunLight);
}

function createFloor() {

	var groundMaterial = new THREE.MeshPhongMaterial({
		shininess : 80,
		color : 0xadafad,
		specular : 0xadafad
	});

	var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(6000, 3000), groundMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.position.y = -45;
	floor.receiveShadow = true;
	g_scene.add(floor);
}

function createTeddy() {

	g_teddy = new Teddy();
	g_scene.add(g_teddy.allGroup);
}

function animate() {

	document.getElementById('video_canvas').hidden = g_gui.closed;

	if (USE_ORBIT_CONTROLS) {
		g_controls.update();
	}

	// Move the bear
	detectorPosition.x = g_motionDetector.offsetAlpha + g_motionDetector.amplificationAlpha * g_motionDetector.averageX.getValue();
	detectorPosition.y = g_motionDetector.offsetGamma + g_motionDetector.amplificationGamma * g_motionDetector.averageY.getValue();
	g_teddy.move(detectorPosition.x, detectorPosition.y, 100, 100);

	// Render scene
	requestAnimationFrame(animate);
	g_renderer.render(g_scene, g_camera);
}
