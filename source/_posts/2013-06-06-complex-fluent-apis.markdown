---
layout: post
title: "Complex Fluent APIs (Part 1)"
date: 2012-08-20 12:11
comments: true
categories: ASP.NET
published: true
---
I recently had my first go at creating a [fluent API](http://en.wikipedia.org/wiki/Fluent_interface). On their own, fluent APIs are quite simple to build. There's plenty of examples and tutorials out there. But the models I needed to build had a deep hirearchy. I wanted my fluent API to be smart enough to only allow the developer access to certain methods at each level of inheritance. In the end I had a mixture of fluent API and a [builder pattern](http://en.wikipedia.org/wiki/Builder_pattern).
<!-- more -->
## Some Background

I've built a custom data-grid component. It is split into two parts; client side JavaScript &mdash; for all user interactions &mdash; and server side (ASP.NET) that helps the developer define the grid configuration and then renders the grid HTML. Currently all the definitions are done via properties, normally using the property initializer.

``` c#
var grid = new Grid
{
    // Where the grid will request data from, via AJAX
    Url = Url.Action("List", "Products"),

    Columns = new List<BaseColumnModel>
    {
        // Column Title, Row data property
        new PlainTextColumnModel("Name", "Name"),
        new PlainTextColumnModel("Description", "Description"),
        new PlainTextColumnModel("Tax", "Tax")
        {
            Hidden = !Model.IsTaxEnabled,
            Align = ColumnAlign.Right
        }
        new PlainTextColumnModel("Price", "SellPrice")
        {
            ToolTip = "Product Sell Price",
            Align = ColumnAlign.Right,
        }
    }
};
```

Defining the grid columns is where a good fluent API would make life easier for the developer. Currently, even with inteli-sense, it's difficult to discover what options are available to you. So this is where I am introducing the fluent API. And as a bonus, strongly typing this data-grid gives us the opportunity to use expressions instead of strings for defining our row data.

``` c#
// If you don't supply the second argument - "Description" - for the column header, then "Product Description" is inferred from the expression
new PlainTextColumnModel(x => x.ProductDescription, "Description")
``` 

## Designing the API
First we need to think about how we want the API structured. So I start by sketching up some ideas on what the column definitions could look like. We have some complex requirements in here:

``` c#
columns.AddPlainTextColumnModel(x => x.Name);
columns.AddPlainTextColumnModel(x => x.Description);
columns.AddPlainTextColumnModel(x => x.Tax)
    .If(!Model.IsTaxEnabled)
        .IsHidden()
    .AlignRight();

columns.AddPlainTextColumnModel(x => x.SellPrice, "Price")
    .WithToolTip("Product Sell Price")
    // New functionality; on any row, if the sell price is below the cost, add a class so we can color it red.
    .When(x => x.IsSellBelowCost)
        .IsTrue().AddClass("sell-price-warning")
    .AlignRight();
```

This is how I would like the API to read. There's a little bit of nesting in there. We want to conditionally show or hide a column, and then on a per-row basis add a class if the sell price is below the cost price.

## Models
The first part of the problem is the models. These are what our fluent API will eventually spit out for our grid to use. Since I already have something in place, I don't actually need to modify these models much, just some changes for the expressions and strong typing. We should note that there is an inheritence hirearchy to them.

``` c#
public class BaseColumnModel<TRowModel>
{
    public string Name { get; set; }
    
    public ColumnAlign Align { get; set; }
    
    // Bunch of other base properties
    
    public BaseColumnModel(string name)
    {
        Name = name;
    }
}

public class SinglePropertyColumnModel<TRowModel>
{
    public Expression<Func<<TRowModel>, object>> Property { get; set; }
    
    public SinglePropertyColumnModel(Expression<Func<<TRowModel>, object>> property, string name) : base(name)
    {
        Property = property;
    }
}

public class PlainTextColumnModel<TRowModel>
{
}
```

It goes a bit deeper than this since we also have input cells etc (In total we have 16 column types). The main point is, in our fluent API, if the developer starts adding a ```PlainTextColumnModel```, then they also need to be able to reach all the methods that are available on the ```BaseColumnModel```. This gets messy when we start to introduce generics &mdash; required for out strongly typed expressions. You will see why soon.

## Model Builders

The model builders will do the actual work, providing each level of the fluent API and keep track of what properties are being added. Eventually we will call `Build()` on them to get the populated models.

Our main grid property initializer can stay where it is for now as we are only making a fluent API for the column definitions. We will add ```ColumnModelsBuilder<TRowModel>``` where ```TRowModel``` is the strongly typed row model for the grid. And as part of the refactoring to strongly type the grid, the ```Columns``` property is now of type ```IList<BaseColumnModel<TRowModel>>```.

``` c# ColumnModelsBuilder.cs
public class ColumnModelsBuilder<TRowModel>
{
    internal IList<BaseColumnModel<TRowModel>> ColumnModels { get; private set; }

    public ColumnModelsBuilder()
    {
        ColumnModels = new List<BaseColumnModel<TRowModel>>();
    }

    public IList<BaseColumnModel<TRowModel>> Build()
    {
        return ColumnModels;
    }
}
```

``` c#
var grid = new Grid<Product>()
{
    // ...
}

var columns = new ColumnModelsBuilder<Product>();
// ... add some columns
grid.Columns = columns.Build();
```

From here, I add a separate extensions class for each type of column builder. You can see the generics mess starting to pile up.

``` c# PlainTextColumnModelExtensions.cs
public static class PlainTextColumnModelExtensions
{
    public static PlainTextColumnModelBuilder<TRowModel> AddPlainTextColumn<TRowModel>(
        this ColumnModelsBuilder<TRowModel> columnModelsBuilder,
        Expression<Func<TRowModel, object>> property,
        string header = null)
    {
        var model = new PlainTextColumnModel<TRowModel>()
        {
            Property = property,
            Header = header         
        };
        
        columnModelsBuilder.ColumnModels.Add(model);
        
        return new PlainTextColumnModelBuilder(model);
    }
}
```

It's these extension methods that give us the ```AddPlainTextColumn``` methods that set-up the builder, attach the model, and start the fluent chain.