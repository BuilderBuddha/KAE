import { useEffect, useState } from 'react';

import type { LogEntry, LogLevel } from '@scooper/core';



const LEVEL_CLASS: Record<LogLevel, string> = {

  debug: 'log-level--debug',

  info: 'log-level--info',

  warn: 'log-level--warn',

  error: 'log-level--error',

};



export function LogsScreen() {

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    window.kae

      .getLogs()

      .then(setLogs)

      .finally(() => setLoading(false));



    const unsub = window.kae.onLogAdded((entry) => {

      setLogs((prev) => [entry, ...prev].slice(0, 500));

    });



    const interval = setInterval(() => {

      window.kae.getLogs().then(setLogs);

    }, 5000);



    return () => {

      unsub();

      clearInterval(interval);

    };

  }, []);



  return (

    <div className="screen">

      <header className="screen__header">

        <h2 className="screen__title">Logs</h2>

        <p className="screen__description">Application activity and diagnostic messages.</p>

      </header>



      {loading ? (

        <p className="muted">Loading logs…</p>

      ) : logs.length === 0 ? (

        <section className="card empty-state">

          <p className="empty-state__title">No log entries</p>

        </section>

      ) : (

        <section className="card logs-panel">

          <ul className="logs-list">

            {logs.map((log) => (

              <li key={log.id} className={`log-entry ${LEVEL_CLASS[log.level] ?? ''}`}>

                <span className="log-entry__time">

                  {new Date(log.timestamp).toLocaleString()}

                </span>

                <span className={`log-entry__level log-level ${LEVEL_CLASS[log.level]}`}>

                  {log.level.toUpperCase()}

                </span>

                <span className="log-entry__source">[{log.source}]</span>

                <span className="log-entry__message">{log.message}</span>

              </li>

            ))}

          </ul>

        </section>

      )}

    </div>

  );

}


