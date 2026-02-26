import { confirmAction } from './confirm';

describe('confirmAction', () => {
  it('uses provided confirm function', () => {
    const confirmFn = jest.fn(() => true);
    expect(confirmAction('Delete?', confirmFn)).toBe(true);
    expect(confirmFn).toHaveBeenCalledWith('Delete?');
  });

  it('falls back to window.confirm', () => {
    const spy = jest.spyOn(window, 'confirm').mockReturnValueOnce(false);
    expect(confirmAction('Are you sure?')).toBe(false);
    expect(spy).toHaveBeenCalledWith('Are you sure?');
    spy.mockRestore();
  });
});
