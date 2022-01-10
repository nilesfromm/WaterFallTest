class Scene{

    //--------------------------------------------------------------------------
    constructor(){

		this.settings = {

			container_width:				800,
			container_height:				400,

			background:						false,
			hdr:							'None', //'GradSoftStudio.hdr',
			envs: [
				'None',
				'BasicStudio.hdr',
				'OverheadDotsAndFloorStudio.hdr',
				'BasicStudio2.hdr',
				'OverheadDotsStudio.hdr',
				'BasicStudio3.hdr',
				'RingLightAndSoftboxesStudio.hdr',
				'BevelReflection.hdr',
				'RingStudio.hdr',
				'BlueWashStudio.hdr',
				'SoftLightsStudio1.hdr',
				'ColorSoftboxStudio.hdr',
				'SoftLightsStudio2.hdr',
				'DivaStudio.hdr',
				'SpotsandUmbrellaStudio.hdr',
				'GradSoftStudio.hdr',
				'Studio4.hdr',
				'GreyStudio.hdr',
				'ThreeSoftboxesStudio1.hdr',
				'KinoStudio.hdr',
				'ThreeSoftboxesStudio2.hdr',
				'KinoStudio2.hdr',
				'TotaStudio.hdr',
			],
			background_color: 				'#e8e8e8',
			floor_color:					'#e8e8e8',

			fov:							50,

			fog_near:						10.0,
			fog_depth:						10.0,

			has_controls: 					true,

			shadow_opacity: 				0.75,
			shadow_size: 					1024,
			shadowplane_y: 					0,
			shadowplane_opacity: 			0.1,

			plight_visible:					true,
			plight_intensity: 			    0.7, 
			plight_color: 				    0xffffff,
			plight_x: 					    3.3,
			plight_y: 			        	4.5,
			plight_z: 					    1.25,
			plight_distance: 				6.1,
            plight_shadows:                 true,
			plight_shadow_radius: 			2,

			dlight_visible:					true,
			dlight_intensity: 	            1.65,
			dlight_color: 		            0xffffff,
			dlight_x: 			            1.09, 
			dlight_y: 		   		        6.23, 
			dlight_z: 			            9.6,
            dlight_shadows:                 true,
			dlight_shadow_radius: 			2,

			hlight_intensity: 	            1.1, 
 

			colorVar: [
				"#222222",
				"#3d613f",
				"#fcfcfc",
			]

		};

		this.update_counter = 0;

		this.setup();
		this.gui_folder = _G.DATGUI.addFolder('SCENE');
		this.gui_background = this.gui_folder.addFolder('BACKGROUND')
		this.gui_lights = this.gui_folder.addFolder('LIGHTS')
		this.gui_material = _G.DATGUI.addFolder('MATERIAL');
		//_G.MYLOADER.setMaterials(this.gui_material);
		this.setup_datgui();
		this.start();
    }

    //--------------------------------------------------------------------------
    setup(){
		//---Scene---
		this.scene = new THREE.Scene();
		this.container = document.getElementById( 'mycanvas' );
		this.wrapper = document.getElementById( 'ThreeWrapper' );
		this.container.width = this.settings.container_width;
		this.container.height = this.settings.container_height;
		this.wrapper.width = this.settings.container_width;
		this.wrapper.height = this.settings.container_height;
        this.renderer = new THREE.WebGLRenderer( { canvas:this.container, antialias:true, alpha:true } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		// this.renderer.physicallyCorrectLights = true;
		this.renderer.shadowIntensity = this.settings.shadow_opacity;
		this.renderer.shadowMap.enabled = _G.SHADOWS_ON;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.pmremGenerator = new THREE.PMREMGenerator( this.renderer );
    	this.pmremGenerator.compileEquirectangularShader();

		//---Background---
		this.renderer.setClearColor( this.settings.background_color, 1);
		this.scene.fog = new THREE.Fog( this.settings.background_color, this.settings.fog_near, this.settings.fog_near + this.settings.fog_depth );
		
		//---Camera---
		this.camera = new THREE.PerspectiveCamera( this.settings.fov, window.innerWidth / window.innerHeight, 0.05, 300 );
		this.camera.position.set(4,1.5,4);
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix();
		this.scene.add( this.camera );

		//---Lights---
		// const light1  = new THREE.AmbientLight(0xFFFFFF, 0.3);
		// light1.name = 'ambient_light';
		// this.scene.add( light1 );

		this.hlight = new THREE.HemisphereLight(0xcccccc, 0x666666, this.settings.hlight_intensity );
		this.hlight.visible = this.settings.hlight_visible;
		this.hlight.position.set(0, 10, 0);
		this.scene.add( this.hlight ); 

		this.dlight = new THREE.DirectionalLight();
		this.dlight.visible = this.settings.dlight_visible;
		this.dlight.intensity = this.settings.dlight_intensity;
		this.dlight.position.set(this.settings.dlight_x, this.settings.dlight_y, this.settings.dlight_z);
		this.dlight.castShadow = this.settings.dlight_shadows;
		//this.dlight.lookAt(0,2,0);
		this.dlight.shadow.camera.zoom = 2.0; //wtf does this do
		this.dlight.shadow.mapSize.width = this.settings.shadow_size;
		this.dlight.shadow.mapSize.height = this.settings.shadow_size;
		this.dlight.shadow.camera.near = 0.1; 
		this.dlight.shadow.camera.far = 100; 
		this.dlight.shadow.camera.fov = 30; 
		this.dlight.shadow.radius = this.settings.dlight_shadow_radius;
		this.scene.add(this.dlight);

		this.plight = new THREE.PointLight();
		this.plight.visible = this.settings.plight_visible;
		this.plight.intensity = this.settings.plight_intensity;
		this.plight.position.set(this.settings.plight_x, this.settings.plight_y, this.settings.plight_z);
		this.plight.castShadow = this.settings.plight_shadows;
		this.plight.shadow.camera.zoom = 2.0; //wtf does this do
		this.plight.shadow.mapSize.width = this.settings.shadow_size;
		this.plight.shadow.mapSize.height = this.settings.shadow_size;
		this.plight.shadow.camera.near = 0.1; 
		this.plight.shadow.camera.far = 100; 
		this.plight.shadow.camera.fov = 30; 
		this.plight.shadow.radius = this.settings.plight_shadow_radius;
        this.scene.add(this.plight);

		// var planeGeometry = new THREE.PlaneGeometry(25, 25);
		// planeGeometry.rotateX(-Math.PI / 2);
		//planeGeometry.translate(0,-1,0);

		// this.floorMat = new THREE.MeshStandardMaterial({color:this.settings.floor_color});		//{color:0xe8e8e8});
		//this.floorMat.color = this.settings.floor_color;
		// this.floor = new THREE.Mesh(planeGeometry, this.floorMat);
		// this.scene.add(this.floor);

		// this.shadowplane = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({color:0x0000006,opacity:this.settings.shadowplane_opacity}));
		// this.shadowplane.receiveShadow = true;
		// this.scene.add(this.shadowplane);
		//this.shadowplane.visible = true;


		// const grid = new THREE.GridHelper( 50, 50, 0xcce0ff, 0xcce0ff );
		// grid.material.opacity = 1;
		// grid.material.transparent = true;
		// this.scene.add( grid );

		if(this.settings.has_controls){
			this.controls = new THREE.OrbitControls( this.camera, this.container );
			this.controls.enabled = true; //enabled after we hit play
			this.controls.screenSpacePanning = true;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.05;
			this.controls.rotateSpeed = 1.0;
			this.controls.zoomSpeed = 1;
			this.controls.target.set(0, 0.3, 0);
			this.controls.maxPolarAngle = (Math.PI/2)-0.025;
			// this.controls.minDistance = 1.5;
			// this.controls.maxDistance = 5;
		}

		// const minPan = new THREE.Vector3( 0, 0.3, 0 );
		// const maxPan = new THREE.Vector3( 0, 0.3, 0 );

		// this.controls.addEventListener("change", (c)=>{
		// 	c.target.target.clamp(minPan, maxPan);
		// 	// if(this.camera.position.y < 1){
		// 	// 	this.camera.position.y = 1;
		// 	// }
		// 	//console.log(this.camera.position.y);
		// 	// _v.copy(controls.target);
		// 	// controls.target.clamp(minPan, maxPan);
		// 	// _v.sub(controls.target);
		// 	// camera.position.sub(_v);
		// })

		// responsive
		window.addEventListener( 'resize', ()=>{
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize( window.innerWidth, window.innerHeight );
		}, false );

		//call ring lamp class
		

		// _G.MYLOADER.load('../3DFILES/gltf/cradenza/cradenza.gltf');
		this.updateEnvironment();
    }

	//--------------------------------------------------------------------------
	render(){

		//ADD UPDATES HERE
		//_G.MYLOADER.updateMaterials();
		if(_G.MYINTERACT2D){_G.MYINTERACT2D.update();}
		if(_G.MYINTERACT3D){_G.MYINTERACT3D.update();}
		if(this.settings.has_controls && this.controls){this.controls.update();}
		
		this.update_counter++;
		if(this.update_counter%1==0){
			if(_G.MYMODEL){_G.MYMODEL.update(this.update_counter);}
		}

		this.renderer.render( this.scene, this.camera );

    }
    start(){
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

	updateEnvironment() {

		const envpath = "./3D_Files/01 Studios/";
		let environment = envpath + this.settings.hdr;
	
		this.getCubeMapTexture( environment ).then(( { envMap } ) => {
		  this.scene.environment = envMap;
		  this.scene.background = this.settings.background ? envMap : null;
		//   console.log(this.scene.environment);
		});
	
	  }
	
	  getCubeMapTexture ( environment ) {
		const path = environment;
	
		// no envmap
		if(path.includes("None")) return Promise.resolve( { envMap: null } );
		if ( ! path ) return Promise.resolve( { envMap: null } );
	
		return new Promise( ( resolve, reject ) => {
	
		  new THREE.RGBELoader()
			.setDataType( THREE.UnsignedByteType )
			.load( path, ( texture ) => {
	
			  const envMap = this.pmremGenerator.fromEquirectangular( texture ).texture;
			  this.pmremGenerator.dispose();
	
			  resolve( { envMap } );
	
			}, undefined, reject );
	
		});
	
	  }

	//--------------------------------------------------------------------------


    //--------------------------------------------------------------------------
    setup_datgui(){

		this.gui_background.add(this.settings, 'fov', 10, 100, 1).name('Camera FOV').onChange((val)=>{
            this.camera.fov = val;
			var pi = Math.PI;

			let zoomDistance = 3 / (2 * Math.tan(0.5 * (val * (pi/180)))),
				factor = zoomDistance/this.camera.position.length();

			this.camera.position.x *= factor;
			this.camera.position.y *= factor;
			this.camera.position.z *= factor;
			this.camera.updateProjectionMatrix();
        });
		this.gui_background.add(this.settings, 'background').name('Show HDR').onChange((val)=>{
            this.updateEnvironment();
        });
		this.gui_background.add(this.settings, 'hdr', this.settings.envs).onChange((val)=>{
            this.updateEnvironment();
        });
		this.gui_background.add(this.settings, 'fog_near', 0, 20, 1).onChange((val)=>{
            console.log(this.scene.fog.near = val);
        });
		this.gui_background.add(this.settings, 'fog_depth', 0, 20, 1).onChange((val)=>{
            console.log(this.scene.fog.far = this.scene.fog.near + val);
        });
        this.gui_background.addColor( this.settings, 'background_color' ).onChange(( colorValue )=>{
			this.renderer.setClearColor( colorValue );
			this.scene.fog.color.set( colorValue );
        });
		this.gui_background.addColor( this.settings, 'floor_color' ).onChange(( colorValue )=>{
			this.floorMat.color.set( colorValue );
        });

		this.gui_lights.add(this.settings, 'hlight_intensity', 0.5, 1.25, 0.01).onChange((val)=>{
            this.hlight.intensity = val;
        });
		this.gui_lights.add(this.settings, 'dlight_visible').onChange((val)=>{
            this.dlight.visible = val;
        });
		this.gui_lights.add(this.settings, 'dlight_shadows').onChange((val)=>{
            this.dlight.castShadow = val;
        });
		this.gui_lights.add(this.settings, 'plight_shadow_radius', 0.0, 10.0, 0.1).onChange((val)=>{
            this.dlight.shadow.radius = val;
        });
        this.gui_lights.add(this.settings, 'dlight_intensity', 0.0, 2.0, 0.01).onChange((val)=>{
            this.dlight.intensity = val;
        });
        this.gui_lights.add(this.settings, 'dlight_x', -5, 5, 0.01).onChange((val)=>{
            this.dlight.position.x = val;
        });
		this.gui_lights.add(this.settings, 'dlight_y', 0, 15, 0.01).onChange((val)=>{
            this.dlight.position.y = val;
        });
        this.gui_lights.add(this.settings, 'dlight_z', -5, 5, 0.01).onChange((val)=>{
            this.dlight.position.z = val;
        });
		this.gui_lights.add(this.settings, 'plight_visible').onChange((val)=>{
            this.plight.visible = val;
        });
		this.gui_lights.add(this.settings, 'plight_shadows').onChange((val)=>{
            this.plight.castShadow = val;
        });
        this.gui_lights.add(this.settings, 'plight_intensity', 0.0, 1.0, 0.01).onChange((val)=>{
            this.plight.intensity = val;
        });
        this.gui_lights.add(this.settings, 'plight_x', -5, 5, 0.01).onChange((val)=>{
            this.plight.position.x = val;
        });
		this.gui_lights.add(this.settings, 'plight_y', 0, 15, 0.01).onChange((val)=>{
            this.plight.position.y = val;
        });
        this.gui_lights.add(this.settings, 'plight_z', -5, 5, 0.01).onChange((val)=>{
            this.plight.position.z = val;
        });
        this.gui_lights.add(this.settings, 'shadowplane_opacity', 0.0, 0.60, 0.01).onChange((val)=>{ 
            this.shadowplane.material.opacity = val;
            // if(val<=0){
            //     _G.MYTHREE.shadowplane.visible = false;
            // }else{
            //     _G.MYTHREE.shadowplane.visible = true;
            // }
        });

    }

}