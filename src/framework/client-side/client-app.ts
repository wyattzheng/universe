import 'reflect-metadata';
import * as PIXI from 'pixi.js';

import React from 'react';
import ReactDOM from 'react-dom';

import { ParseTexturePath, TextureProvider, TextureType } from './texture';
import { EventBusClient } from './bus-client';
import { Viewport } from './viewport';
import { Container, interfaces } from 'inversify';
import { bindToContainer, resolveAllBindings } from '../inversify';
import { UIEntry, UIEventBus } from './user-interface/hooks';

import { UIStateContainer } from './user-interface/state';
import { ClientModuleResolvedResult, ClientSideModule, resolveClientSideModule } from '../module';

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.SORTABLE_CHILDREN = true;

export interface TextureDef {
	name: string;
	url: string;
}

export interface ClientApplicationOption {
	serverUrl: string;
	playground: HTMLDivElement;
	texturePaths: string[];
	uiEntry: any;
	module: ClientSideModule;
}

export function wait(time: number) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

export class ClientApp {
	private updateTick = 0;
	private fixedTick = 0;
	private lastFixedTickTime = 0;

	private app: PIXI.Application;

	private managers: any[] = [];
	private controllers: any[] = [];

	private uiStatesContainer: UIStateContainer;
	private textureProvider = new TextureProvider();

	private viewport: Viewport;
	private busClient: EventBusClient;
	private uiEventBus: UIEventBus;

	private iocContainer: Container;
	private resolution = 32;

	private worldWidth = 4 * 7;
	private worldHeight = 3 * 7;

	private wrapper: HTMLDivElement;
	private uiContainer: HTMLDivElement;

	private playground: HTMLElement;

	private moduleResolved: ClientModuleResolvedResult;

	constructor(private option: ClientApplicationOption) {
		this.moduleResolved = resolveClientSideModule(option.module);

		this.app = new PIXI.Application({
			resolution: this.resolution,
			width: this.worldWidth,
			height: this.worldHeight,
		});

		this.playground = option.playground;

		this.iocContainer = new Container({ skipBaseClassChecks: true });
		this.uiStatesContainer = new UIStateContainer(this.moduleResolved.uiStates);

		this.managers = this.moduleResolved.managers;
		this.controllers = this.moduleResolved.controllers;

		this.viewport = new Viewport(
			this.worldWidth * this.resolution,
			this.worldHeight * this.resolution,
			this.worldWidth,
			this.worldHeight,
		);
		this.busClient = new EventBusClient(this.option.serverUrl);
		this.uiEventBus = new UIEventBus();

		this.initProviderBindings();
		this.initWrapper();
		this.initUiContainer();
	}

	getCanvasElement() {
		return this.app.view;
	}

	get<T>(identifier: interfaces.ServiceIdentifier<T>) {
		return this.iocContainer.get(identifier);
	}

	getCanvas() {
		return this.app.view;
	}

	addTicker(fn: any) {
		this.app.ticker.add(fn);
	}

	addDisplayObject(displayObject: PIXI.DisplayObject) {
		this.viewport.addChild(displayObject);
	}

	removeDisplayObject(displayObject: PIXI.DisplayObject) {
		this.viewport.removeChild(displayObject);
	}

	removeTicker(fn: any) {
		this.app.ticker.remove(fn);
	}

	async start() {
		await this.initTextures();

		this.initUIBindings();
		this.initBaseBindings();

		resolveAllBindings(this.iocContainer, this.managers);
		resolveAllBindings(this.iocContainer, this.controllers);

		this.app.start();

		this.renderUI();
		this.startLoop();
	}

	private initWrapper() {
		const wrapper = document.createElement('div');
		wrapper.classList.add('uni-wrapper');
		wrapper.style.width = `${this.app.view.width}px`;
		wrapper.style.height = `${this.app.view.height}px`;
		wrapper.style.position = 'relative';

		this.playground.appendChild(wrapper);
		this.wrapper = wrapper;
	}

	private initUiContainer() {
		const container = document.createElement('div');
		container.classList.add('uni-ui-container');
		container.style.position = 'absolute';
		container.style.left = '0px';
		container.style.top = '0px';
		container.style.width = '100%';
		container.style.height = '100%';
		container.style.userSelect = 'none';
		container.style.pointerEvents = 'none';

		this.wrapper.appendChild(container);
		this.wrapper.appendChild(this.app.view);
		this.uiContainer = container;
	}

	private initProviderBindings() {
		for (const provider of this.moduleResolved.providers) {
			this.iocContainer.bind(provider.key).toConstantValue(provider.value);
		}
	}

	private initBaseBindings() {
		const ioc = this.iocContainer;

		ioc.bind(EventBusClient).toConstantValue(this.busClient);
		ioc.bind(Viewport).toConstantValue(this.viewport);
		ioc.bind(TextureProvider).toConstantValue(this.textureProvider);
		ioc.bind(UIEventBus).toConstantValue(this.uiEventBus);

		bindToContainer(ioc, [...this.managers, ...this.controllers]);

		const viewport = ioc.get(Viewport);
		this.app.stage.addChild(viewport);
	}

	private initUIBindings() {
		this.iocContainer.bind(UIStateContainer).toConstantValue(this.uiStatesContainer);

		for (const [stateClass, state] of this.uiStatesContainer.getEntries()) {
			this.iocContainer.bind(stateClass).toConstantValue(state);
		}
	}

	private renderUI() {
		const dataSource = this.iocContainer.get(UIStateContainer);

		const ticker = this.app.ticker;
		const eventBus = this.uiEventBus;
		const textureProvider = this.textureProvider;

		ReactDOM.render(
			React.createElement(UIEntry, { dataSource, ticker, eventBus, textureProvider }, React.createElement(this.option.uiEntry)),
			this.uiContainer,
		);
	}

	private doUpdateTick() {
		for (const manager of this.managers) {
			this.iocContainer.get<any>(manager).doUpdateTick(this.updateTick);
		}

		this.updateTick += 1;
	}

	private doFixedUpdateTick() {
		for (const manager of this.managers) {
			this.iocContainer.get<any>(manager).doFixedUpdateTick(this.fixedTick);
		}

		this.fixedTick += 1;
	}

	private async startLoop() {
		this.app.ticker.add(this.doUpdateTick.bind(this));
		this.app.ticker.add(this.doFixedUpdateTick.bind(this));
	}

	private async initTextures() {
		for (const path of this.option.texturePaths) {
			const parsed = ParseTexturePath(path);
			if (Boolean(parsed) === false) continue;
			const [key, relPath, type] = parsed;
			if (type == TextureType.IMAGESET) {
				await this.textureProvider.addJSON(key, relPath);
			} else {
				await this.textureProvider.add(key, relPath);
			}
		}
	}
}