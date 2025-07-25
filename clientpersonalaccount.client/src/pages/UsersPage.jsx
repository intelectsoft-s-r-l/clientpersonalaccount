import React from "react";

export default function UsersPage() {
  return (
    <div id="users" className="page-section">
      <div className="top-header">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Пользователи сервиса</h4>
          <button className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i> Добавить пользователя
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Поиск пользователей..."
          />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">
            <i className="bi bi-funnel"></i> Фильтры
          </button>
          <button className="btn btn-outline-secondary">
            <i className="bi bi-download"></i> Экспорт
          </button>
        </div>
      </div>

      <div className="data-grid">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя пользователя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Последний вход</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>Алексей Иванов</td>
              <td>alexey.ivanov@email.com</td>
              <td>Администратор</td>
              <td>
                <span className="status-badge status-active">Активен</span>
              </td>
              <td>2024-11-06 14:30</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-1">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
            {/* Добавь остальные строки по аналогии */}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">Показано 1-5 из 1,247 записей</div>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item disabled">
              <span className="page-link">Предыдущая</span>
            </li>
            <li className="page-item active">
              <span className="page-link">1</span>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                2
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                3
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                Следующая
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
