import { expect, test } from '@rstest/core';
import { screen } from '@testing-library/dom';

test('DOM rendering sanity check', () => {
  document.body.innerHTML = `
    <span data-testid="not-empty"><span data-testid="empty"></span></span>
    <div data-testid="visible">Visible Example</div>
  `;

  expect(screen.queryByTestId('not-empty')).not.toBeNull();
  expect(screen.queryByTestId('not-empty')?.children.length).toBe(1);
  expect(screen.queryByTestId('empty')).not.toBeNull();
  expect(screen.getByTestId('visible').textContent).toBe('Visible Example');
});
