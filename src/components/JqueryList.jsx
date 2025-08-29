import React, { useEffect } from 'react';
import $ from 'jquery';

export default function JqueryList() {
	useEffect(() => {
		const $error = $('#errorMessage');
		const $input = $('#jqueryInput');
		const $list = $('#jqueryList');

		function addItem() {
			const val = $input.val().trim();
			if (!val) {
				$error.fadeIn(300);
				setTimeout(() => $error.fadeOut(300), 2000);
				return;
			}
			const $li = $(
				`<li class="jquery-list-item"><span>${val}</span><button class="jquery-delete-btn">Delete</button></li>`
			);
			$li.find('.jquery-delete-btn').on('click', () =>
				$li.fadeOut(300, () => $li.remove())
			);
			$list.append($li);
			$input.val('');
		}

		$('#jqueryAddBtn').on('click', addItem);
		$input.on('keypress', (e) => {
			if (e.which === 13) addItem();
		});

		return () => {
			$('#jqueryAddBtn').off('click');
			$input.off('keypress');
		};
	}, []);

	return (
		<div className='dashboard-container jquery-task-container'>
			<h2 className='jquery-task-title'> jQuery Dynamic List</h2>
			<div className='error-message' id='errorMessage'>
				Please enter a valid item!
			</div>
			<div className='jquery-input-group'>
				<input
					id='jqueryInput'
					className='jquery-input'
					placeholder='Enter item name...'
				/>
				<button id='jqueryAddBtn' className='jquery-add-btn'>
					Add Item
				</button>
			</div>
			<ul id='jqueryList' className='jquery-list'></ul>
		</div>
	);
}
