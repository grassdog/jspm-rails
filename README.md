# Combining JSPM and Rails

This is an attempt at placing [jspm](http://jspm.io/) into a Rails app.

You too can try the goodness of [ES6](https://github.com/lukehoban/es6features#readme) and [SystemJS](https://github.com/systemjs/systemjs) in an existing Rails app.

Note that this makes no attempt to integrate jspm with the asset pipeline.

All of the Javascript files managed by jspm live under `public/js`.

To add a package just run jspm e.g. `jspm install react`.

You can tweak jspm settings (such as the transpiler to use) by running `jspm init -p`.

This project already has [React](http://facebook.github.io/react/) integrated (look in `public/js/lib/main.jsx`).

## Live reload

If you want livereload kick up guard `guard` and `rails server` and you should be off to the races.

## Building for Production

Running `rake js:build` uses jspm to build and minify the javascript files and place them into a cache-busting versioned directory. Note that this task relies on git being present for version detection.

There are view helpers that detect if you are running in production and load the compiled assets correctly.

