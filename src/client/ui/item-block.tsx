import classNames from 'classnames';
import React, { useState } from 'react';
import { useTexturePath, useTextureProvider } from '../../framework/client-side/user-interface/hooks';
import { ItemType, ItemTypeName } from '../../server/module/inventory-module/item-entity';

import './item-block.css';

export interface ItemBlockProps {
	containerId: number;
	index: number;
	itemType: ItemType;
	count: number;
	highlight: boolean;
	className?: string;
	onDragOver?: (index: number, containerId: number) => void;
	onDragLeave?: () => void;
	onDragEnd?: () => void;
	onDrop: (sourceContainerId: number, sourceIndex: number, targetContainerId: number, targetIndex: number) => void;
}

export function ItemBlock(props: ItemBlockProps) {
	const provider = useTextureProvider();

	const [dragOver, setDragOver] = useState(false);

	function onBlockDragStart(ev: React.DragEvent) {
		const index = +ev.currentTarget.getAttribute('data-index');
		const image = ev.currentTarget.firstElementChild;

		if (props.itemType === ItemType.EMPTY) {
			ev.preventDefault();
			return;
		}

		ev.dataTransfer.setData(
			'text/plain',
			JSON.stringify({
				containerId: props.containerId,
				index,
			}),
		);
		ev.dataTransfer.setDragImage(image, 0, 0);
	}

	function onBlockDragOver(ev: React.DragEvent) {
		const index = +ev.currentTarget.getAttribute('data-index');

		ev.preventDefault();
		ev.dataTransfer.dropEffect = 'move';

		setDragOver(true);
		props.onDragOver && props.onDragOver(index, props.containerId);
	}

	function onBlockDragLeave() {
		setDragOver(false);
		props.onDragLeave && props.onDragLeave();
	}

	function onBlockDragEnd(ev: React.DragEvent) {
		props.onDragEnd && props.onDragEnd();
		setDragOver(false);
	}

	function onBlockDrop(ev: React.DragEvent) {
		const { containerId: sourceContainerId, index: sourceIndex } = JSON.parse(ev.dataTransfer.getData('text/plain'));
		const targetIndex = +ev.currentTarget.getAttribute('data-index');

		props.onDrop(sourceContainerId, sourceIndex, props.containerId, targetIndex);
		setDragOver(false);
	}
	const texturePath = useTexturePath(provider, `item.${ItemTypeName[props.itemType]}.normal`);

	const clsName = classNames(
		{
			'item-block': true,
			'item-block-highlight': props.highlight,
			'item-block-drag-over': dragOver,
		},
		props.className,
	);
	return (
		<div
			draggable="true"
			data-index={props.index}
			onDrop={onBlockDrop}
			onDragStart={onBlockDragStart}
			onDragOver={onBlockDragOver}
			onDragEnd={onBlockDragEnd}
			onDragLeave={onBlockDragLeave}
			className={clsName}
		>
			<img className="item-block-img" src={texturePath} />
		</div>
	);
}