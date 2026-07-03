import { useEffect, useState } from 'react';

import type { ImportJob } from '@scooper/core';



const STATUS_LABELS: Record<ImportJob['status'], string> = {

  pending: 'Pending',

  queued: 'Queued',

  running: 'Running',

  completed: 'Completed',

  failed: 'Failed',

  cancelled: 'Cancelled',

};



export function JobQueueScreen() {

  const [jobs, setJobs] = useState<ImportJob[]>([]);

  const [loading, setLoading] = useState(true);



  const refreshJobs = () => {

    window.kae.getJobs().then(setJobs);

  };



  useEffect(() => {

    refreshJobs();

    setLoading(false);

    const unsub = window.kae.onJobUpdated(() => refreshJobs());

    const interval = setInterval(refreshJobs, 3000);

    return () => {

      unsub();

      clearInterval(interval);

    };

  }, []);



  return (

    <div className="screen">

      <header className="screen__header">

        <h2 className="screen__title">Job Queue</h2>

        <p className="screen__description">Monitor import jobs and their progress.</p>

      </header>



      {loading ? (

        <p className="muted">Loading jobs…</p>

      ) : jobs.length === 0 ? (

        <section className="card empty-state">

          <p className="empty-state__title">No jobs in queue</p>

          <p className="empty-state__hint">Import a ChatGPT export ZIP from the Import screen.</p>

        </section>

      ) : (

        <table className="table">

          <thead>

            <tr>

              <th>Source</th>

              <th>Format</th>

              <th>Status</th>

              <th>Progress</th>

              <th>Created</th>

            </tr>

          </thead>

          <tbody>

            {jobs.map((job) => (

              <tr key={job.id}>

                <td>{job.source.name}</td>

                <td>{job.format}</td>

                <td>

                  <span className={`status status--${job.status}`}>

                    {STATUS_LABELS[job.status]}

                  </span>

                  {job.error && <span className="job-error" title={job.error}> ⚠</span>}

                </td>

                <td>

                  <div className="progress-bar">

                    <div

                      className="progress-bar__fill"

                      style={{ width: `${job.progress}%` }}

                    />

                    <span className="progress-bar__label">{job.progress}%</span>

                  </div>

                </td>

                <td>{new Date(job.createdAt).toLocaleString()}</td>

              </tr>

            ))}

          </tbody>

        </table>

      )}



      {jobs.some((j) => j.summary) && (

        <section className="screen__section">

          <h3 className="screen__section-title">Recent Results</h3>

          {jobs

            .filter((j) => j.summary)

            .slice(0, 3)

            .map((job) => (

              <div key={job.id} className="card job-summary-card">

                <p>

                  <strong>{job.source.name}</strong> — {job.summary!.sourcesCreated} created,{' '}

                  {job.summary!.skippedDuplicates} skipped

                </p>

              </div>

            ))}

        </section>

      )}

    </div>

  );

}


