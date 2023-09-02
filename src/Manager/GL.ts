/*
    RPG Paper Maker Copyright (C) 2017-2023 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { THREE } from '../Globals';
import { Datas, Scene, System } from '../index';
import { ScreenResolution, Platform, Utils, IO, Paths } from '../Common';
import { Stack } from './Stack';
import { Camera, Vector3, Vector2 } from '../Core';

/** @class
 *  The GL class handling some 3D stuff.
 *  @static
 */
class GL {
	public static SHADER_FIX_VERTEX: string;
	public static SHADER_FIX_FRAGMENT: string;
	public static SHADER_FACE_VERTEX: string;
	public static SHADER_FACE_FRAGMENT: string;
	public static renderer: THREE.WebGLRenderer;
	public static textureLoader = new THREE.TextureLoader();
	public static raycaster = new THREE.Raycaster();
	public static screenTone = new THREE.Vector4(0, 0, 0, 1);

	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 *  Initialize the openGL stuff.
	 *  @static
	 */
	static initialize() {
		this.renderer = new THREE.WebGLRenderer({ antialias: Datas.Systems.antialias, alpha: true });
		this.renderer.autoClear = false;
		this.renderer.setSize(ScreenResolution.CANVAS_WIDTH, ScreenResolution.CANVAS_HEIGHT, true);
		this.renderer.shadowMap.enabled = true;
		if (Datas.Systems.antialias) {
			this.renderer.setPixelRatio(2);
		}
		document.body.appendChild(this.renderer.domElement);
	}

	/**
	 *  Load shaders stuff.
	 *  @static
	 */
	static async load() {
		// Shaders
		let json = await Platform.loadFile(Paths.SHADERS + 'default.vert', true);
		this.SHADER_FIX_VERTEX = json;
		json = await Platform.loadFile(Paths.SHADERS + 'default.frag', true);
		this.SHADER_FIX_FRAGMENT = json;
		json = await Platform.loadFile(Paths.SHADERS + 'default.vert', true);
		this.SHADER_FACE_VERTEX = json;
		json = await Platform.loadFile(Paths.SHADERS + 'default.frag', true);
		this.SHADER_FACE_FRAGMENT = json;
	}

	/**
	 *  Set the camera aspect while resizing the window.
	 *  @static
	 */
	static resize() {
		if (this.renderer) {
			this.renderer.setSize(ScreenResolution.CANVAS_WIDTH, ScreenResolution.CANVAS_HEIGHT, true);
			let camera: Camera;
			for (let i = 0, l = Stack.content.length; i < l; i++) {
				camera = Stack.content[i].camera;
				if (!Utils.isUndefined(camera)) {
					camera.resizeGL();
				}
			}
		}
	}

	/**
	 *  Load a texture.
	 *  @param {string} path - The path of the texture
	 *  @returns {Promise<THREE.Material>}
	 */
	static async loadTexture(path: string): Promise<THREE.MeshPhongMaterial> {
		let texture: THREE.Texture = await new Promise((resolve, reject) => {
			this.textureLoader.load(
				path,
				(t: THREE.Texture) => {
					resolve(t);
				},
				() => {},
				() => {
					let error = 'Could not load ' + path;
					if (Datas.Systems.ignoreAssetsLoadingErrors) {
						let t = new THREE.Texture();
						t.image = new Image();
						console.log(error);
						resolve(t);
					} else {
						Platform.showErrorMessage(error);
					}
				}
			);
		});
		return this.createMaterial({ texture: texture });
	}

	/**
	 *  Load a texture empty.
	 *  @returns {THREE.Material}
	 */
	static loadTextureEmpty(): THREE.MeshPhongMaterial {
		const material = new THREE.MeshPhongMaterial();
		material.userData.uniforms = {
			t: { value: undefined },
		};
		return material;
	}

	/**
	 *  Create a material from texture.
	 *  @returns {THREE.MeshPhongMaterial}
	 */
	static createMaterial(opts: {
		texture?: THREE.Texture | null;
		flipX?: boolean;
		flipY?: boolean;
		uniforms?: Record<string, any>;
		side?: number;
		repeat?: number;
		opacity?: number;
		shadows?: boolean;
	}): THREE.MeshPhongMaterial {
		if (!opts.texture) {
			opts.texture = new THREE.Texture();
		}
		opts.texture.magFilter = THREE.NearestFilter;
		opts.texture.minFilter = THREE.NearestFilter;
		opts.texture.flipY = opts.flipY ? true : false;
		opts.repeat = Utils.defaultValue(opts.repeat, 1.0);
		opts.opacity = Utils.defaultValue(opts.opacity, 1.0);
		opts.shadows = Utils.defaultValue(opts.shadows, true);
		opts.side = Utils.defaultValue(opts.side, THREE.DoubleSide);
		const fragment = this.SHADER_FIX_FRAGMENT;
		const vertex = this.SHADER_FIX_VERTEX;
		const screenTone = this.screenTone;
		const uniforms = opts.uniforms
			? opts.uniforms
			: {
					offset: { value: new THREE.Vector2() },
					colorD: { value: screenTone },
					repeat: { value: opts.repeat },
					enableShadows: { value: opts.shadows },
			  };

		// Program cache key for multiple shader programs
		const key = fragment === this.SHADER_FIX_FRAGMENT ? 0 : 1;

		// Create material
		const material = new THREE.MeshPhongMaterial({
			map: opts.texture,
			side: opts.side,
			transparent: true,
			alphaTest: 0.5,
			opacity: opts.opacity,
		});
		material.userData.uniforms = uniforms;
		material.userData.customDepthMaterial = new THREE.MeshDepthMaterial({
			depthPacking: THREE.RGBADepthPacking,
			map: opts.texture,
			alphaTest: 0.5,
		});

		// Edit shader information before compiling shader
		material.onBeforeCompile = (shader) => {
			shader.fragmentShader = fragment;
			shader.vertexShader = vertex;
			shader.uniforms.colorD = uniforms.colorD;
			shader.uniforms.reverseH = { value: opts.flipX };
			shader.uniforms.repeat = { value: opts.repeat };
			shader.uniforms.offset = uniforms.offset;
			shader.uniforms.enableShadows = { value: opts.shadows };
			material.userData.uniforms = shader.uniforms;

			// Important to run a unique shader only once and be able to use
			// multiple shader with before compile
			material.customProgramCacheKey = () => {
				return '' + key;
			};
		};

		return material;
	}

	static cloneMaterial(material: THREE.MeshPhongMaterial): THREE.MeshPhongMaterial {
		return this.createMaterial({
			texture: material.map,
			flipY: material.map.flipY,
			side: material.side,
			repeat: material.userData.uniforms.repeat.value,
			opacity: material.opacity,
			shadows: material.userData.uniforms.enableShadows.value,
		});
	}

	/**
	 *  Get material THREE.Texture (if exists).
	 *  @param {THREE.MeshPhongMaterial}
	 *  @returns {THREE.Texture}
	 */
	static getMaterialTexture(material: THREE.MeshPhongMaterial): THREE.Texture {
		return material && material.map ? material.map : null;
	}

	/**
	 *  Update the background color
	 *  @static
	 *  @param {System.Color} color
	 */
	static updateBackgroundColor(color: System.Color) {
		this.renderer.setClearColor(color.getHex(this.screenTone), color.alpha);
	}

	/**
	 *  Convert 3D vector to a 2D point on screen.
	 *  @static
	 *  @param {Vector3} vector - The 3D vector
	 *  @param {THREE.Camera} camera - The three.js camera
	 *  @returns {Vector2}
	 */
	static toScreenPosition(vector: Vector3, camera: THREE.Camera): Vector2 {
		let widthHalf = ScreenResolution.CANVAS_WIDTH / 2;
		let heightHalf = ScreenResolution.CANVAS_HEIGHT / 2;
		let position = vector.clone();
		camera.updateMatrixWorld(true);
		position.project(camera);
		return new Vector2(position.x * widthHalf + widthHalf, -(position.y * heightHalf) + heightHalf);
	}
}

export { GL };
