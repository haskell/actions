declare namespace NodeJS {
  export interface ProcessEnv {
    /**
     * The path to the GitHub home directory used to store user data.
     *
     * Example: /github/home.
     */
    HOME: string;

    /** The name of the workflow. */
    GITHUB_WORKFLOW: string;

    /**
     * A unique number for each run within a repository. This number does not
     * change if you re-run the workflow run.
     */
    GITHUB_RUN_ID: string;

    /**
     * A unique number for each run of a particular workflow in a repository.
     * This number begins at 1 for the workflow's first run, and increments with
     * each new run. This number does not change if you re-run the workflow run.
     * */
    GITHUB_RUN_NUMBER: string;

    /** The unique identifier (id) of the action. */
    GITHUB_ACTION: string;

    /**
     * Always set to true when GitHub Actions is running the workflow. You can
     * use this variable to differentiate when tests are being run locally or
     * by GitHub Actions.
     */
    GITHUB_ACTIONS: string;

    /**
     * The name of the person or app that initiated the workflow.
     *
     * Example: octocat.
     */
    GITHUB_ACTOR: string;

    /** The owner and repository name. For example, octocat/Hello-World. */
    GITHUB_REPOSITORY: string;

    /** The name of the webhook event that triggered the workflow. */
    GITHUB_EVENT_NAME: string;

    /**
     * The path of the file with the complete webhook event payload.
     *
     * Example: /github/workflow/event.json.
     */
    GITHUB_EVENT_PATH: string;

    /**
     * The GitHub workspace directory path. The workspace directory contains a
     * subdirectory with a copy of your repository if your workflow uses the
     * actions/checkout action. If you don't use the actions/checkout action,
     * the directory will be empty.
     *
     * Example: /home/runner/work/my-repo-name/my-repo-name.
     */
    GITHUB_WORKSPACE: string;

    /**
     * The commit SHA that triggered the workflow.
     *
     * Example: ffac537e6cbbf934b08745a378932722df287a53.
     */
    GITHUB_SHA: string;

    /**
     * The branch or tag ref that triggered the workflow. If neither a branch
     * or tag is available for the event type, the variable will not exist.
     *
     * Example: refs/heads/feature-branch-1.
     */
    GITHUB_REF: string;

    /** Only set for forked repositories. The branch of the head repository. */
    GITHUB_HEAD_REF: string;

    /** Only set for forked repositories. The branch of the base repository. */
    GITHUB_BASE_REF: string;
  }
}
